#ifndef ENV_SENSORS_H
#define ENV_SENSORS_H

#include <Arduino.h>

/* ---------------- Soil Moisture ---------------- */
class SoilMoistureSensor {
public:
    SoilMoistureSensor(uint8_t pin, int dryValue = 1023, int wetValue = 0);
    void begin();
    int readRaw();
    int readPercentage();
    int readAveraged(uint8_t samples = 10);
    void calibrate(int dryValue, int wetValue);

private:
    uint8_t _pin;
    int _dryValue;
    int _wetValue;
};

/* ---------------- DHT11 Sensor ---------------- */
class DHT11 {
public:
    DHT11(uint8_t dataPin);
    void begin();
    uint8_t read(float &temperature, float &humidity);

private:
    uint8_t _dataPin;

    uint8_t readByte();
    uint8_t waitForState(uint8_t state, uint32_t timeout);
};

/* ---------------- LDR Sensor ---------------- */
class LDRSensor {
public:
    LDRSensor(uint8_t analogPin, int darkValue = 0, int lightValue = 1023);
    void begin();
    int readRaw();
    int readAveraged(uint8_t samples = 10);
    int readPercentage();
    void calibrate(int darkValue, int lightValue);

private:
    uint8_t _analogPin;
    int _darkValue;
    int _lightValue;
};

/* ---------------- Combined Class ---------------- */
class EnvSensors {
public:
    EnvSensors(uint8_t soilPin, uint8_t dhtPin, uint8_t ldrPin);

    void begin();

    // Soil moisture
    int getSoilRaw();
    int getSoilPercent();

    // DHT11
    uint8_t readTemperatureHumidity(float &temperature, float &humidity);

    // LDR
    int getLightRaw();
    int getLightPercent();

private:
    SoilMoistureSensor _soil;
    DHT11 _dht;
    LDRSensor _ldr;
};

#endif
f