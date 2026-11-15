import time
import network
import urequests
from machine import Pin, I2C, ADC
import dht

TEMPERATURE_OFFSET_C = -3.5

# ---------------- WIFI CONFIG ----------------
WIFI_SSID = "TP-Link_F2A8"
WIFI_PASSWORD = "76577826"
SERVER_URL = "https://conjuror-dictation-factor.ngrok-free.dev/log"
SENSOR_INGEST_TOKEN = "T1p-PM8UiQ10BW9Lf8ykmiNhpqLIVbqNpNJ2CSo3Lp8"  # Match SENSOR_INGEST_TOKEN in the receiving PC's .env.server.
# For the public tunnel, SERVER_URL = "https://conjuror-dictation-factor.ngrok-free.dev/log"
# ----------------------------------------------

# ---- Pin setup ----
DHT_PIN = 2
MQ135_PIN = 26   # ADC0
SOUND_PIN = 27   # ADC1

d = dht.DHT11(Pin(DHT_PIN))

# I2C0 on Pico: SDA=GP4, SCL=GP5
i2c = I2C(0, scl=Pin(5), sda=Pin(4), freq=400000)

air_adc = ADC(Pin(MQ135_PIN))
sound_adc = ADC(Pin(SOUND_PIN))


# ---- Minimal BH1750 driver (no library needed) ----
class BH1750:
    PWR_ON = 0x01
    RESET = 0x07
    CONT_HIRES = 0x10

    def __init__(self, i2c, addr=0x23):
        self.i2c = i2c
        self.addr = addr
        self.i2c.writeto(self.addr, bytes([self.PWR_ON]))
        self.i2c.writeto(self.addr, bytes([self.RESET]))
        self.i2c.writeto(self.addr, bytes([self.CONT_HIRES]))
        time.sleep_ms(180)

    def read_lux(self):
        data = self.i2c.readfrom(self.addr, 2)
        raw = (data[0] << 8) | data[1]
        return raw / 1.2


try:
    light_meter = BH1750(i2c)
    bh1750_ok = True
except Exception:
    bh1750_ok = False

print("BH1750 Ready" if bh1750_ok else "BH1750 Failed")


# ---- WiFi connect ----
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Connecting to WiFi...")
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        timeout = 20
        while not wlan.isconnected() and timeout > 0:
            time.sleep(1)
            timeout -= 1
    if wlan.isconnected():
        print("WiFi connected:", wlan.ifconfig())
        return True
    else:
        print("WiFi connection failed")
        return False


wifi_ok = connect_wifi()
print("Sensors Initialized")

# ---- Main loop ----
while True:
    air_quality = air_adc.read_u16() >> 4

    lux = None
    if bh1750_ok:
        try:
            lux = round(light_meter.read_lux(), 2)
        except Exception:
            lux = None

    temperature = None
    humidity = None
    try:
        d.measure()
        temperature = round((d.temperature()-3.5), 1)
        humidity = round(d.humidity(), 1)
    except Exception:
        pass

    signal_max = 0
    signal_min = 4095
    start = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), start) < 50:
        sample = sound_adc.read_u16() >> 4
        if sample > signal_max:
            signal_max = sample
        if sample < signal_min:
            signal_min = sample
    sound_level = signal_max - signal_min

    print("air={} lux={} temp={} hum={} sound={}".format(
        air_quality, lux, temperature, humidity, sound_level
    ))

    # Reconnect WiFi if it dropped
    if not wifi_ok:
        wifi_ok = connect_wifi()

    if wifi_ok:
        payload = {
            "air_quality": air_quality,
            "lux": lux,
            "temperature_c": temperature,
            "humidity_pct": humidity,
            "sound_level": sound_level,
        }
        try:
            response = urequests.post(SERVER_URL, json=payload,
                                      headers={"X-Sensor-Token": SENSOR_INGEST_TOKEN})
            if response.status_code >= 400:
                print("Server rejected reading, HTTP", response.status_code)
            response.close()
        except Exception as e:
            print("Failed to send data:", e)
            wifi_ok = False  # force reconnect attempt next loop

    time.sleep(1)

    
