#include "EnvSensors.h"

/* ---------------- Soil Moisture ---------------- */

SoilMoistureSensor::SoilMoistureSensor(uint8_t pin, int dryValue, int wetValue)
    : _pin(pin), _dryValue(dryValue), _wetValue(wetValue) {}

void SoilMoistureSensor::begin() {
    pinMode(_pin, INPUT);
}

int SoilMoistureSensor::readRaw() {
    return analogRead(_pin);
}

int SoilMoistureSensor::readPercentage() {
    int raw = readRaw();
    int percent = map(raw, _dryValue, _wetValue, 0, 100);
    return constrain(percent, 0, 100);
}

int SoilMoistureSensor::readAveraged(uint8_t samples) {
    long total = 0;
    for (uint8_t i = 0; i < samples; i++) {
        total += analogRead(_pin);
        delay(5);
    }
    return total / samples;
}

void SoilMoistureSensor::calibrate(int dryValue, int wetValue) {
    _dryValue = dryValue;
    _wetValue = wetValue;
}

/* ---------------- DHT11 Sensor ---------------- */

DHT11::DHT11(uint8_t dataPin) : _dataPin(dataPin) {}

void DHT11::begin() {
    pinMode(_dataPin, INPUT_PULLUP);
}

uint8_t DHT11::waitForState(uint8_t state, uint32_t timeout) {
    uint32_t start = micros();
    while (digitalRead(_dataPin) != state) {
        if (micros() - start > timeout) return 1;
    }
    return 0;
}

uint8_t DHT11::readByte() {
    uint8_t value = 0;
    for (uint8_t i = 0; i < 8; i++) {
        waitForState(HIGH, 100);
        delayMicroseconds(30);

        if (digitalRead(_dataPin) == HIGH)
            value |= (1 << (7 - i));

        waitForState(LOW, 100);
    }
    return value;
}

uint8_t DHT11::read(float &temperature, float &humidity) {
    uint8_t data[5] = {0};

    pinMode(_dataPin, OUTPUT);
    digitalWrite(_dataPin, LOW);
    delay(20);
    digitalWrite(_dataPin, HIGH);
    delayMicroseconds(40);
    pinMode(_dataPin, INPUT_PULLUP);

    if (waitForState(LOW, 100)) return 1;
    if (waitForState(HIGH, 100)) return 2;
    if (waitForState(LOW, 100)) return 3;

    for (uint8_t i = 0; i < 5; i++)
        data[i] = readByte();

    uint8_t checksum = data[0] + data[1] + data[2] + data[3];
    if (checksum != data[4]) return 4;

    humidity = data[0];
    temperature = data[2];

    return 0;
}

/* ---------------- LDR Sensor ---------------- */

LDRSensor::LDRSensor(uint8_t analogPin, int darkValue, int lightValue)
    : _analogPin(analogPin), _darkValue(darkValue), _lightValue(lightValue) {}

void LDRSensor::begin() {
    pinMode(_analogPin, INPUT);
}

int LDRSensor::readRaw() {
    return analogRead(_analogPin);
}

int LDRSensor::readAveraged(uint8_t samples) {
    long sum = 0;
    for (uint8_t i = 0; i < samples; i++) {
        sum += analogRead(_analogPin);
        delay(3);
    }
    return sum / samples;
}

int LDRSensor::readPercentage() {
    int raw = readRaw();
    int percent = map(raw, _darkValue, _lightValue, 0, 100);
    return constrain(percent, 0, 100);
}

void LDRSensor::calibrate(int darkValue, int lightValue) {
    _darkValue = darkValue;
    _lightValue = lightValue;
}

/* ---------------- Combined Class ---------------- */

EnvSensors::EnvSensors(uint8_t soilPin, uint8_t dhtPin, uint8_t ldrPin)
    : _soil(soilPin), _dht(dhtPin), _ldr(ldrPin) {}

void EnvSensors::begin() {
    _soil.begin();
    _dht.begin();
    _ldr.begin();
}

int EnvSensors::getSoilRaw() {
    return _soil.readRaw();
}

int EnvSensors::getSoilPercent() {
    return _soil.readPercentage();
}

uint8_t EnvSensors::readTemperatureHumidity(float &temperature, float &humidity) {
    return _dht.read(temperature, humidity);
}

int EnvSensors::getLightRaw() {
    return _ldr.readRaw();
}

int EnvSensors::getLightPercent() {
    return _ldr.readPercentage();
}
