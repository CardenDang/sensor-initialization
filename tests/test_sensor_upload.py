import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError
from sensor_upload import UploadQueue, sensor_values
import server

OWNER = '11111111-1111-4111-8111-111111111111'
READING = {'air_quality': 123, 'lux': 0, 'temperature_c': -2, 'humidity_pct': 50, 'sound_level': 42}

class Response:
    status = 201
    def __enter__(self): return self
    def __exit__(self, *args): return False

class UploadTests(unittest.TestCase):
    def test_retry_survives_restart_and_preserves_id_and_owner(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'queue.sqlite'
            queue = UploadQueue(path, 'https://example.supabase.co', 'sb_secret_test', OWNER)
            identifier = queue.enqueue(dict(READING, timestamp='2026-11-15T21:00:00Z', user_id='attacker'))
            with patch('sensor_upload.urlopen', side_effect=URLError('offline')):
                with self.assertRaises(URLError): queue.flush()
            restarted = UploadQueue(path, 'https://example.supabase.co', 'sb_secret_test', OWNER)
            with patch('sensor_upload.urlopen', return_value=Response()) as upload:
                self.assertEqual(restarted.flush(), 1)
                request = upload.call_args.args[0]
                payload = json.loads(request.data)[0]
                self.assertEqual(payload['id'], identifier)
                self.assertEqual(payload['user_id'], OWNER)
                self.assertEqual(payload['lux'], 0)
                self.assertIn('resolution=ignore-duplicates', request.get_header('Prefer'))
                self.assertIsNone(request.get_header('Authorization'))
                self.assertEqual(restarted.flush(), 0)

    def test_validation(self):
        self.assertEqual(sensor_values(READING)['temperature_c'], -2)
        self.assertIsNone(sensor_values({'lux': ''})['lux'])
        for values in [None, [], {}, {'humidity_pct': 101}, {'lux': -1}, {'lux': True}, {'sound_level': 'nan'}, {'air_quality': 'Infinity'}, {'temperature_c': 100000}]:
            with self.assertRaises(ValueError): sensor_values(values)

    def test_endpoint_token_excel_and_queue(self):
        with tempfile.TemporaryDirectory() as directory:
            queue = UploadQueue(Path(directory)/'queue.sqlite', 'https://example.supabase.co', 'sb_secret_test', OWNER)
            excel = str(Path(directory)/'readings.xlsx')
            with patch.multiple(server, TOKEN='device-token', uploader=queue, EXCEL_PATH=excel):
                client = server.app.test_client()
                self.assertEqual(client.post('/log', json=READING).status_code, 401)
                headers = {'X-Sensor-Token': 'device-token'}
                self.assertEqual(client.post('/log', json={'lux': -1}, headers=headers).status_code, 400)
                response = client.post('/log', json=READING, headers=headers)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json['status'], 'queued')
                self.assertTrue(response.json['excel_saved'])
                self.assertEqual(client.get('/api/data').status_code, 401)
                self.assertEqual(client.get('/api/data', headers=headers).json['total'], 1)
                with patch('server.get_or_create_workbook', side_effect=PermissionError('Excel is open')):
                    response = client.post('/log', json=READING, headers=headers)
                    self.assertEqual(response.status_code, 200)
                    self.assertFalse(response.json['excel_saved'])
                with queue.connect() as db:
                    self.assertEqual(db.execute('SELECT count(*) FROM pending').fetchone()[0], 2)

if __name__ == '__main__': unittest.main()
