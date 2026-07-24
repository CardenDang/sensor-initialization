import time
from machine import Pin, I2C, ADC
import dht

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

# Header line so the PC script (and you, watching the monitor) know the column order.
# The PC logger looks for lines starting with "DATA," and ignores everything else,
# so it's safe to also print human-readable status lines.
print("BH1750 Ready" if bh1750_ok else "BH1750 Failed")
print("Sensors Initialized")
print("DATA,air_quality,lux,temperature_c,humidity_pct,sound_level")

# ---- Main loop ----
while True:
    air_quality = air_adc.read_u16() >> 4  # scale 16-bit -> 0-4095 like Arduino

    lux = ""
    if bh1750_ok:
        try:
            lux = "{:.2f}".format(light_meter.read_lux())
        except Exception:
            lux = ""

    temperature = ""
    humidity = ""
    try:
        d.measure()
        temperature = "{:.1f}".format(d.temperature())
        humidity = "{:.1f}".format(d.humidity())
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

    # Machine-readable line the PC script will parse
    print("DATA,{},{},{},{},{}".format(
        air_quality, lux, temperature, humidity, sound_level
    ))

    time.sleep(1)