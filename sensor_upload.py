"""Durable Supabase upload queue. Credentials stay on the receiving PC."""
import json
import logging
import math
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from uuid import UUID, uuid4

FIELDS = ('air_quality', 'lux', 'temperature_c', 'humidity_pct', 'sound_level')


def sensor_values(data):
    if not isinstance(data, dict) or not any(field in data for field in FIELDS):
        raise ValueError('Provide a JSON object with sensor fields.')
    result = {}
    for field in FIELDS:
        raw = data.get(field)
        if raw is None or raw == '':
            result[field] = None
            continue
        if isinstance(raw, bool):
            raise ValueError(f'{field} must be numeric.')
        try:
            value = float(raw)
        except (ValueError, TypeError):
            raise ValueError(f'{field} must be numeric.') from None
        if not math.isfinite(value) or (field != 'temperature_c' and value < 0):
            raise ValueError(f'Invalid {field}.')
        if field == 'humidity_pct' and value > 100:
            raise ValueError('Humidity must be between 0 and 100.')
        limit = 100000 if field == 'temperature_c' else 1000000000
        if abs(value) >= limit:
            raise ValueError(f'{field} is out of range.')
        result[field] = value
    return result


class UploadQueue:
    def __init__(self, path, url, key, user_id):
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme != 'https' or not parsed.hostname or parsed.query or parsed.fragment:
            raise ValueError('SUPABASE_URL must be an HTTPS project URL.')
        self.user_id = str(UUID(user_id))
        self.path = str(path)
        self.url = url.rstrip('/') + '/rest/v1/sleep_records?on_conflict=id'
        self.headers = {'apikey': key, 'Content-Type': 'application/json',
                        'Prefer': 'resolution=ignore-duplicates,return=minimal'}
        # Legacy service_role keys are JWTs; modern secret keys use apikey only.
        if not key.startswith('sb_secret_'):
            self.headers['Authorization'] = 'Bearer ' + key
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS pending (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=15)
        try:
            with db:
                yield db
        finally:
            db.close()

    def enqueue(self, record):
        # Never accept ownership or arbitrary columns supplied by a device.
        payload = {field: record[field] for field in ('timestamp',) + FIELDS}
        payload.update(id=str(uuid4()), user_id=self.user_id)
        with self.connect() as db:
            db.execute('INSERT INTO pending VALUES (?,?)', (payload['id'], json.dumps(payload, allow_nan=False)))
        return payload['id']

    def flush(self):
        with self.connect() as db:
            rows = db.execute('SELECT id,payload FROM pending ORDER BY rowid LIMIT 100').fetchall()
        if not rows:
            return 0
        request = Request(self.url, data=('[' + ','.join(row[1] for row in rows) + ']').encode(), headers=self.headers, method='POST')
        try:
            with urlopen(request, timeout=10) as response:
                if not 200 <= response.status < 300:
                    raise RuntimeError('Unexpected Supabase response')
        except HTTPError as error:
            # Do not log request headers, credentials, or sensitive response bodies.
            raise RuntimeError(f'Supabase returned HTTP {error.code}; check server credentials, owner UUID, and migrations.') from None
        with self.connect() as db:
            db.executemany('DELETE FROM pending WHERE id=?', [(row[0],) for row in rows])
        return len(rows)

    def run(self, stop):
        delay = 1
        while not stop.is_set():
            try:
                count = self.flush()
                delay = 0.1 if count == 100 else 2
            except Exception:
                logging.warning('Supabase upload failed; readings remain queued. Check server configuration/connectivity.')
                delay = min(max(delay * 2, 5), 60)
            stop.wait(delay)
