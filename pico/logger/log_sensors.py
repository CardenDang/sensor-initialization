import serial
import csv
import time
from datetime import datetime

PORT = "COM3"       # change to your Pico's actual COM port
BAUD = 9600
OUTPUT_FILE = "sleep_data.csv"

ser = serial.Serial(PORT, BAUD, timeout=2)
time.sleep(2)  # let connection settle

with open(OUTPUT_FILE, mode="a", newline="") as f:
    writer = csv.writer(f)
    if f.tell() == 0:
        writer.writerow([
            "Timestamp", "Temperature_C", "Humidity_%",
            "AirQuality_raw", "Light_lux", "CO2_ppm", "Sound_raw"
        ])

    print("Logging started. Press Ctrl+C to stop.")
    try:
        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line.startswith("CSV,"):
                values = line[4:].split(",")  # strip "CSV," prefix
                if len(values) == 6:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    row = [timestamp] + values
                    writer.writerow(row)
                    f.flush()
                    print(row)
    except KeyboardInterrupt:
        print("Logging stopped.")