#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

const int MQ135_PIN = A0;
const int SOUND_PIN = A1;

BH1750 lightMeter;
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);

  Wire.begin();

  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE))
    Serial.println("BH1750 Ready");
  else
    Serial.println("BH1750 Failed");

  dht.begin();
}

void loop() {

  // MQ135
  int airQuality = analogRead(MQ135_PIN);

  // BH1750
  float lux = lightMeter.readLightLevel();

  // DHT11
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Sound
  int soundLevel = analogRead(SOUND_PIN);

  Serial.println("------------------------");

  Serial.print("Air Quality: ");
  Serial.println(airQuality);

  Serial.print("Light: ");
  Serial.print(lux);
  Serial.println(" lx");

  if (!isnan(temperature) && !isnan(humidity)) {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  } else {
    Serial.println("DHT11 Read Failed");
  }

  Serial.print("Sound Level: ");
  Serial.println(soundLevel);

  delay(1000);
}