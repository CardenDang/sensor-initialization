from machine import Pin, I2C, ADC
import dht
import time

from bh1750 import BH1750
from PiicoDev_ENS160 import PiicoDev_ENS160

# ---- PIN CONFIG: fill these in based on your wiring ----
DHT_PIN = None          # TODO: GPIO pin for DHT11 data (e.g. 2)
MQ135_PIN = None        # TODO: ADC-capable GPIO (must be 26, 27, or 28)
SOUND_PIN = None        # TODO: ADC-capable GPIO (must be 26, 27, or 28)
I2C_SDA_PIN = None      # TODO: GPIO pin for I2C SDA (e.g. 0)
I2C_SCL_PIN = None      # TODO: GPIO pin for I2C SCL (e.g. 1)
# ----------------------------------------------------------

# Setup
dht_sensor = dht.DHT11(Pin(DHT_PIN))
mq135 = ADC(Pin(MQ135_PIN))
sound = ADC(Pin(SOUND_PIN))

i2c = I2C(0, scl=Pin(I2C_SCL_PIN), sda=Pin(I2C_SDA_PIN), freq=400000)
print("I2C devices found:", [hex(a) for a in i2c.scan()])  # sanity check

# BH1750 setup
light_sensor = BH1750(i2c)

# ENS160 setup — pass the SAME sda/scl pins used above
co2_sensor = PiicoDev_ENS160(bus=0, sda=Pin(I2C_SDA_PIN), scl=Pin(I2C_SCL_PIN))

while True:
    # MQ135 (raw ADC, 0-65535 on Pico)
    air_quality = mq135.read_u16()

    # BH1750
    light_sensor.measure()
    time.sleep_ms(BH1750.MEASUREMENT_TIME_mS)
    lux = light_sensor.illuminance

    # DHT11
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        dht_ok = True
    except OSError:
        dht_ok = False

    # Feed temp/humidity into ENS160 for better CO2 accuracy (optional but recommended)
    if dht_ok:
        co2_sensor.temperature = temperature
        co2_sensor.humidity = humidity

    # ENS160 CO2 reading
    eco2 = co2_sensor.eco2

    # Sound
    sound_level = sound.read_u16()

    print("------------------------")
    print("Air Quality:", air_quality)
    print("Light:", lux, "lx")

    if dht_ok:
        print("Temperature:", temperature, "C")
        print("Humidity:", humidity, "%")
    else:
        print("DHT11 Read Failed")

    print("CO2 (eCO2):", eco2, "ppm")
    print("Sound Level:", sound_level)

    # CSV line for logging (parsed by the PC-side Python script)
    if dht_ok:
        print(f"CSV,{temperature},{humidity},{air_quality},{lux},{eco2},{sound_level}")
    else:
        print(f"CSV,,,{air_quality},{lux},{eco2},{sound_level}")

    time.sleep(1)