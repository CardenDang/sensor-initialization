"""
Sensor Logger - PC-side WiFi receiver
---------------------------------------
Runs a small web server on your PC. The Pico sends an HTTP POST request
to this server every second with its sensor readings, and this script
appends each one as a row in an Excel (.xlsx) file.

First-time setup (run once in a terminal):
    pip install -r requirements-server.txt
    See SERVER_SETUP.md for server-only Supabase and device configuration.

Run:
    python server.py

Then find your PC's local IP address (run "ipconfig" in Command Prompt,
look for "IPv4 Address" e.g. 192.168.1.50) and put that into the
SERVER_URL in the Pico's main.py, e.g.:
    SERVER_URL = "http://MY_IP_HERE:5000/log"

Use the PC's LAN URL on the same WiFi, or the HTTPS ngrok /log URL remotely.
"""

import datetime
import os
import hmac
import threading
from pathlib import Path
from dotenv import load_dotenv
from sensor_upload import UploadQueue, sensor_values

from flask import Flask, request, jsonify, render_template_string
from openpyxl import Workbook, load_workbook

# ------------- CONFIGURE THIS -------------
# <-- change to wherever you want the file
load_dotenv(Path(__file__).with_name('.env.server'))
EXCEL_PATH = os.environ.get('EXCEL_PATH', str(Path(__file__).parent / 'data' / 'sensor_log.xlsx'))
TOKEN = os.environ.get('SENSOR_INGEST_TOKEN', '')
upload_config = [os.environ.get(name, '') for name in ('SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SENSOR_OWNER_USER_ID')]
if any(upload_config) and (not all(upload_config) or not TOKEN):
    raise RuntimeError('Configure SUPABASE_URL, SUPABASE_SECRET_KEY, SENSOR_OWNER_USER_ID and SENSOR_INGEST_TOKEN together in .env.server.')
uploader = UploadQueue(os.environ.get('UPLOAD_QUEUE_PATH', 'data/supabase_pending.sqlite'), *upload_config) if all(upload_config) else None
excel_lock = threading.Lock()
# -------------------------------------------

HEADER = ["timestamp", "air_quality", "lux",
          "temperature_c", "humidity_pct", "sound_level"]

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 8192


def get_or_create_workbook(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    try:
        wb = load_workbook(path)
        ws = wb.active
        return wb, ws
    except FileNotFoundError:
        wb = Workbook()
        ws = wb.active
        ws.title = "Sensor Data"
        ws.append(HEADER)
        wb.save(path)
        return wb, ws


DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Sensor Log Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; background: #111; color: #eee; margin: 0; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    #status { color: #7cf; font-size: 13px; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; max-width: 900px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; font-size: 14px; }
    th { background: #1e1e1e; position: sticky; top: 0; }
    tr:hover { background: #1a1a1a; }
    tr:first-child { color: #8f8; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Sensor Log</h1>
  <div id="status">Loading...</div>
  {% if protected %}<label>Sensor token: <input type="password" id="sensor-token" autocomplete="off" placeholder="Enter the device ingestion token"></label>{% endif %}
  <table>
    <thead>
      <tr>
        <th>Timestamp</th><th>Air Quality</th><th>Lux</th><th>Temp (C)</th><th>Humidity (%)</th><th>Sound</th>
      </tr>
    </thead>
    <tbody id="rows"></tbody>
  </table>

  <script>
    async function refresh() {
      try {
        const res = await fetch('/api/data', {headers: {'X-Sensor-Token': document.getElementById('sensor-token')?.value || ''}});
        if (!res.ok) throw new Error(res.status === 401 ? 'Enter the sensor token above.' : 'Server error');
        const data = await res.json();
        const tbody = document.getElementById('rows');
        tbody.innerHTML = '';
        data.rows.forEach(row => {
          const tr = document.createElement('tr');
          tr.innerHTML = row.map(cell => `<td>${cell === null || cell === '' ? '-' : cell}</td>`).join('');
          tbody.appendChild(tr);
        });
        document.getElementById('status').textContent =
          `Showing latest ${data.rows.length} of ${data.total} readings — updated ${new Date().toLocaleTimeString()}`;
      } catch (e) {
        document.getElementById('status').textContent = 'Failed to load data: ' + e;
      }
    }
    refresh();
    setInterval(refresh, 2000); // auto-refresh every 2 seconds
  </script>
</body>
</html>
"""


@app.route("/")
def dashboard():
    return render_template_string(DASHBOARD_HTML, protected=bool(TOKEN))


@app.route("/api/data")
def api_data():
    if TOKEN and not hmac.compare_digest(request.headers.get('X-Sensor-Token', ''), TOKEN):
        return jsonify({'error': 'unauthorized'}), 401
    try:
        with excel_lock:
            wb = load_workbook(EXCEL_PATH)
            ws = wb.active
            all_rows = list(ws.iter_rows(
                min_row=2, values_only=True))  # skip header
            wb.close()
        latest = all_rows[-50:]      # only send the most recent 50 rows
        latest.reverse()             # newest first
        return jsonify({"rows": latest, "total": len(all_rows)})
    except FileNotFoundError:
        return jsonify({"rows": [], "total": 0})


@app.route("/log", methods=["POST"])
def log_reading():
    if TOKEN and not hmac.compare_digest(request.headers.get('X-Sensor-Token', ''), TOKEN):
        return jsonify({'error': 'unauthorized'}), 401
    try:
        data = sensor_values(request.get_json(silent=True))
    except ValueError as error:
        return jsonify({'error': str(error)}), 400

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="microseconds")
    row = [
        timestamp,
        data.get("air_quality"),
        data.get("lux"),
        data.get("temperature_c"),
        data.get("humidity_pct"),
        data.get("sound_level"),
    ]

    # Persist the upload before acknowledging receipt; retries survive a restart.
    record_id = uploader.enqueue(dict(zip(HEADER, row))) if uploader else None
    excel_saved = True
    try:
        with excel_lock:
            wb, ws = get_or_create_workbook(EXCEL_PATH)
            ws.append(row)
            wb.save(EXCEL_PATH)
            wb.close()
    except OSError:
        if not uploader:
            return jsonify({'error': 'Excel file could not be saved.'}), 503
        excel_saved = False
        app.logger.warning('Excel save failed; reading is still queued for Supabase. Close the workbook if it is open.')

    print(f"Logged: {row}")
    return jsonify({'status': 'queued' if uploader else 'ok', 'record_id': record_id, 'excel_saved': excel_saved}), 200


if __name__ == "__main__":
    stop = threading.Event()
    if uploader:
        threading.Thread(target=uploader.run, args=(stop,), daemon=True).start()
    print(f"Logging to: {EXCEL_PATH}")
    print("Starting server on http://0.0.0.0:5000 ...")
    print("Waiting for the Pico to send data. Press Ctrl+C to stop.\n")
    try:
        app.run(host="0.0.0.0", port=5000, use_reloader=False)
    finally:
        stop.set()
