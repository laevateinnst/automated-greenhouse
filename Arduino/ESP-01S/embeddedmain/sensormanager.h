#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <DHT.h>

class SensorManager {
  private:
    byte _soilMoisturePin;
    byte _dhtPin;
    byte _lightSensorPin;
    
    DHT* _dhtSensor;
    byte _dhtType;
    
    int _dryValue;
    int _wetValue;
    
    int _lightOpenThreshold;
    int _lightCloseThreshold;
    float _tempOpenThreshold;
    float _tempCloseThreshold;
    
    // Stepper motor variables
    int _shadePosition;  // 0-100% open
    bool _isShadeMoving;

  public:
    SensorManager(byte soilMoisturePin, byte dhtPin, byte lightSensorPin, byte dhtType = DHT11);
    void begin();
    
    // Soil moisture functions
    int getSoilMoistureRaw();
    int getSoilMoisturePercent();
    String getSoilMoistureStatus();
    
    // Temperature & humidity functions
    float getTemperatureC();
    float getTemperatureF();
    float getHumidity();
    String getTemperatureStatus();
    
    // Light level functions
    int getLightLevelRaw();
    int getLightLevelPercent();
    String getLightLevelStatus();
    
    // Stepper motor control functions
    void openShade(int steps = 0);
    void closeShade(int steps = 0);
    void setShadePosition(int percent);
    int getShadePosition();
    bool isShadeMoving();
    
    // Shade control decisions
    bool shouldOpenShade();
    bool shouldCloseShade();
    String getShadeRecommendation();
    
    // Combined functions
    void printAllReadings();
    bool needsWatering();
    
    // Calibration functions
    void setSoilCalibration(int dryValue, int wetValue);
    void setLightThresholds(int openThreshold = 80, int closeThreshold = 30);
    void setTemperatureThresholds(float openTemp = 30.0, float closeTemp = 20.0);
    
    // Environmental analysis
    float getVaporPressureDeficit();
    String getOverallPlantHealth();
};

#endif