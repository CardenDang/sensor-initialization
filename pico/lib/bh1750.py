# Read ambient light level from BH1750 sensor in Hi-Res One-Time mode

from micropython import const


class BH1750:
    POWER_ON = const(0b_0000_0001)
    ONE_TIME_HRES = const(0b_0010_0000)
    MEASUREMENT_TIME_mS = const(180)

    def __init__(self, i2c, addr=0x23, dome_correction=0):
        self._i2c = i2c
        self._i2c_addr = addr
        self._dome_correction = dome_correction

    def measure(self):
        acks = self._i2c.writeto(self._i2c_addr, BH1750.POWER_ON.to_bytes())
        if acks != 1:
            raise OSError("I2C Power On command not acknowledged.")
        acks = self._i2c.writeto(self._i2c_addr, BH1750.ONE_TIME_HRES.to_bytes())
        if acks != 1:
            raise OSError("I2C Measure command not acknowledged.")

    @property
    def illuminance(self):
        result = self._i2c.readfrom(self._i2c_addr, 2)
        lux = int.from_bytes(result) / 1.2
        if self._dome_correction:
            lux = lux * self._dome_correction
        return round(lux)


def demo():
    from machine import Pin, SoftI2C
    from time import sleep_ms

    # Values for ESP32 Devkit V1 (30-pin board with four corner mounting holes)
    # Adjust as needed for other boards.
    I2C_CLOCK = const(22)
    I2C_DATA = const(21)

    # How much compensation for the sensor's dome?
    DOME_CORRECTION = const(2.75)

    i2c = SoftI2C(scl=Pin(I2C_CLOCK), sda=Pin(I2C_DATA))
    bh1750 = BH1750(i2c, dome_correction=DOME_CORRECTION)
    bh1750.measure()
    sleep_ms(BH1750.MEASUREMENT_TIME_mS)
    lux = bh1750.illuminance
    print("Lux:", lux)


if __name__ == "__main__":
    demo()
