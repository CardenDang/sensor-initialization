# Uploading sensor readings through your receiver

The flow is **Pico ? ngrok `/log` ? `server.py` ? Supabase `sleep_records` ? Raw Data page**.
Excel logging continues. This uses the existing account-private sensor schema; one receiving server is configured for one account. The device cannot choose a different account in its payload.

## 1. Prepare Supabase

Apply the sensor migration `frontend/supabase/migrations/202611150002_sensor_records.sql` if not already applied.
Then run `frontend/supabase/migrations/202611150003_server_upload.sql` once in SQL Editor.
In **Authentication ? Users**, copy the **User UID** of the account receiving the readings.
In the project's **Settings ? API Keys**, obtain a **secret key** (`sb_secret_...`) or legacy **service_role** key. This is different from the publishable key in the frontend.

## 2. Configure the PC running server.py

From the repository root:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-server.txt
Copy-Item .env.server.example .env.server
```

Edit `.env.server`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
SENSOR_OWNER_USER_ID=UUID_FROM_AUTHENTICATION_USERS
SENSOR_INGEST_TOKEN=YOUR_RANDOM_DEVICE_TOKEN
EXCEL_PATH=data/sensor_log.xlsx
UPLOAD_QUEUE_PATH=data/supabase_pending.sqlite
```

Generate an ingestion token with:

```powershell
.venv/Scripts/python.exe -c "import secrets; print(secrets.token_urlsafe(32))"
```

Keep `.env.server` on the receiving PC only. It is ignored by Git. Never put the Supabase secret key in `frontend/.env.local`, a `VITE_` variable, or Pico firmware. Supabase documents server-only secret keys here: https://supabase.com/docs/guides/getting-started/api-keys.

Existing Excel files can be used by setting their full path in `EXCEL_PATH`.

## 3. Run the receiver and tunnel

```powershell
.venv/Scripts/python.exe server.py
```

Forward your ngrok tunnel to port **5000** on this PC. With your existing domain, the device's full destination is:

```text
https://conjuror-dictation-factor.ngrok-free.dev/log
```

The root URL is the receiver's status dashboard, not the upload route. When configured, that dashboard requires the ingestion token to load readings.

The receiver now generates UTC timestamps. It saves uploads to a local SQLite outbox and sends batches in a background worker. Failed uploads remain on disk and retry with backoff, including after restarting the receiver. Queue retries retain the same UUID, so retrying an upload does not create another row. A device resubmitting the same measurement as a new HTTP request is still a new reading.
A success response with `status: queued` means saved locally, not necessarily uploaded yet. If Excel is locked/open, a reading still queues for Supabase, but the failed Excel row is not automatically repaired.
Run the server using the command above: the upload worker starts in this entry point, not by importing the Flask app in another process manager.

## 4. Configure the device

In `main_wifi.py`, set:

```python
SERVER_URL = "https://conjuror-dictation-factor.ngrok-free.dev/log"
SENSOR_INGEST_TOKEN = "THE_SAME_RANDOM_DEVICE_TOKEN"
```

The sender already includes this token as an `X-Sensor-Token` header. If your actual device runs another script, add that same header to its HTTP POST. Only the ingestion token goes on the Pico; the Supabase secret stays on the PC.
The unchanged USB loggers in `pico/logger/` only write Excel/CSV; they do not call this server.

## 5. Verify

After the receiver is running, send a test reading from PowerShell (replace the token):

```powershell
$headers = @{ 'X-Sensor-Token' = 'YOUR_DEVICE_TOKEN' }
$reading = @{ air_quality=1230; lux=2.4; temperature_c=21.5; humidity_pct=48; sound_level=145 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5000/log' -Headers $headers -ContentType 'application/json' -Body $reading
```

This writes one real test reading. Check **Supabase ? Table Editor ? sleep_records**, then sign into the website as the configured account and open **Raw Data**. The page loads the latest 500 readings and refreshes every five seconds. Other accounts cannot read these records.
If uploads stay queued, check the PC's internet connection, server key, account UUID, and applied migrations. Do not delete the queue file while it contains pending readings.

Local tests:

```powershell
.venv/Scripts/python.exe -m unittest discover -s tests -v
```

The tests use a mocked Supabase response and temporary files; they do not require live sensors or send test data to your project.
