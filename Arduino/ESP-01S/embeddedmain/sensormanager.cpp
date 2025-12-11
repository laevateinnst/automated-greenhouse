#include "SensorManager.h"
#include <Stepper.h>

// Define stepper motor parameters (adjust based on your motor)
const int STEPS_PER_REVOLUTION = 2048; // Common for 28BYJ-48 stepper
const int SHADE_OPEN_STEPS = 500;      // Steps to fully open shade
const int SHADE_CLOSE_STEPS = 500;     // Steps to fully close shade
const int SHADE_SPEED = 10;            // RPM

Stepper shadeStepper(STEPS_PER_REVOLUTION, 8, 10, 9, 11); // IN1, IN3, IN2, IN4

SensorManager::SensorManager(byte soilMoisturePin, byte dhtPin, byte lightSensorPin, byte dhtType) {
    _soilMoisturePin = soilMoisturePin;
    _dhtPin = dhtPin;
    _lightSensorPin = lightSensorPin;
    _dhtType = dhtType;
    
    // Default calibration values
    _dryValue = 1023;  
    _wetValue = 300;
    
    // Default thresholds for shade control
    _lightOpenThreshold = 80;    // Open shade when light > 80%
    _lightCloseThreshold = 30;   // Close shade when light < 30%
    _tempOpenThreshold = 30.0;   // Open shade when temp > 30°C
    _tempCloseThreshold = 20.0;  // Close shade when temp < 20°C
    
    // Shade position tracking (0 = fully closed, 100 = fully open)
    _shadePosition = 0;
    _isShadeMoving = false;
}

void SensorManager::begin() {
    pinMode(_soilMoisturePin, INPUT);
    pinMode(_lightSensorPin, INPUT);
    
    _dhtSensor = new DHT(_dhtPin, _dhtType);
    _dhtSensor->begin();
    
    // Initialize stepper motor
    shadeStepper.setSpeed(SHADE_SPEED);
    
    Serial.println("SensorManager initialized for Herb Greenhouse");
    Serial.println("Shade control: Stepper motor");
}

int SensorManager::getSoilMoistureRaw() {
    return analogRead(_soilMoisturePin);
}

int SensorManager::getSoilMoisturePercent() {
    int rawValue = getSoilMoistureRaw();
    int percentage = map(rawValue, _dryValue, _wetValue, 0, 100);
    return constrain(percentage, 0, 100);
}

String SensorManager::getSoilMoistureStatus() {
    int percentage = getSoilMoisturePercent();
    if (percentage < 30) return "DRY - Watering needed";
    else if (percentage < 60) return "OPTIMAL";
    else return "WET - Too much water";
}

float SensorManager::getTemperatureC() {
    return _dhtSensor->readTemperature();
}

float SensorManager::getTemperatureF() {
    return _dhtSensor->readTemperature(true);
}

float SensorManager::getHumidity() {
    return _dhtSensor->readHumidity();
}

String SensorManager::getTemperatureStatus() {
    float tempC = getTemperatureC();
    if (tempC < 15.0) return "TOO COLD";
    else if (tempC < 25.0) return "OPTIMAL";
    else if (tempC < 30.0) return "WARM";
    else return "TOO HOT";
}

int SensorManager::getLightLevelRaw() {
    return analogRead(_lightSensorPin);
}

int SensorManager::getLightLevelPercent() {
    int rawValue = getLightLevelRaw();
    int percentage = map(rawValue, 0, 1023, 0, 100);
    return constrain(percentage, 0, 100);
}

String SensorManager::getLightLevelStatus() {
    int percentage = getLightLevelPercent();
    if (percentage < 20) return "TOO DARK";
    else if (percentage < 70) return "OPTIMAL";
    else return "TOO BRIGHT";
}

// Stepper motor control functions
void SensorManager::openShade(int steps) {
    if (_isShadeMoving) return;
    
    _isShadeMoving = true;
    int stepsToMove = (steps == 0) ? SHADE_OPEN_STEPS : steps;
    
    Serial.print("Opening shade: ");
    Serial.print(stepsToMove);
    Serial.println(" steps");
    
    shadeStepper.step(stepsToMove);
    _shadePosition = constrain(_shadePosition + stepsToMove, 0, 100);
    
    Serial.print("Shade position: ");
    Serial.print(_shadePosition);
    Serial.println("% open");
    
    _isShadeMoving = false;
}

void SensorManager::closeShade(int steps) {
    if (_isShadeMoving) return;
    
    _isShadeMoving = true;
    int stepsToMove = (steps == 0) ? SHADE_CLOSE_STEPS : steps;
    
    Serial.print("Closing shade: ");
    Serial.print(stepsToMove);
    Serial.println(" steps");
    
    shadeStepper.step(-stepsToMove);
    _shadePosition = constrain(_shadePosition - stepsToMove, 0, 100);
    
    Serial.print("Shade position: ");
    Serial.print(_shadePosition);
    Serial.println("% open");
    
    _isShadeMoving = false;
}

void SensorManager::setShadePosition(int percent) {
    if (_isShadeMoving) return;
    
    _isShadeMoving = true;
    int targetSteps = map(percent, 0, 100, 0, SHADE_OPEN_STEPS);
    int stepsToMove = targetSteps - _shadePosition;
    
    Serial.print("Setting shade to ");
    Serial.print(percent);
    Serial.print("% (");
    Serial.print(stepsToMove);
    Serial.println(" steps)");
    
    shadeStepper.step(stepsToMove);
    _shadePosition = percent;
    
    _isShadeMoving = false;
}

int SensorManager::getShadePosition() {
    return _shadePosition;
}

// Shade control decisions
bool SensorManager::shouldOpenShade() {
    int lightLevel = getLightLevelPercent();
    float temperature = getTemperatureC();
    
    // Open shade if light is too high OR temperature is too high
    if (lightLevel > _lightOpenThreshold || temperature > _tempOpenThreshold) {
        return true;
    }
    return false;
}

bool SensorManager::shouldCloseShade() {
    int lightLevel = getLightLevelPercent();
    float temperature = getTemperatureC();
    
    // Close shade if light is too low OR temperature is too low
    if (lightLevel < _lightCloseThreshold || temperature < _tempCloseThreshold) {
        return true;
    }
    return false;
}

String SensorManager::getShadeRecommendation() {
    bool open = shouldOpenShade();
    bool close = shouldCloseShade();
    
    if (open && !close) {
        return "OPEN - Light/Temp too high";
    } else if (close && !open) {
        return "CLOSE - Light/Temp too low";
    } else if (open && close) {
        return "ADJUST - Conflicting conditions";
    } else {
        return "HOLD - Optimal conditions";
    }
}

void SensorManager::printAllReadings() {
    Serial.println("=== HERB GREENHOUSE SENSOR READINGS ===");
    Serial.print("Soil Moisture: ");
    Serial.print(getSoilMoisturePercent());
    Serial.print("% - ");
    Serial.println(getSoilMoistureStatus());
    
    Serial.print("Temperature: ");
    Serial.print(getTemperatureC(), 1);
    Serial.print("°C - ");
    Serial.println(getTemperatureStatus());
    
    Serial.print("Humidity: ");
    Serial.print(getHumidity(), 1);
    Serial.println("%");
    
    Serial.print("Light Level: ");
    Serial.print(getLightLevelPercent());
    Serial.print("% - ");
    Serial.println(getLightLevelStatus());
    
    Serial.print("Shade Position: ");
    Serial.print(getShadePosition());
    Serial.println("% open");
    
    Serial.print("Shade Recommendation: ");
    Serial.println(getShadeRecommendation());
    
    Serial.print("VPD: ");
    Serial.print(getVaporPressureDeficit(), 2);
    Serial.println(" kPa");
    
    Serial.print("Overall Health: ");
    Serial.println(getOverallPlantHealth());
    Serial.println("=======================================");
}

bool SensorManager::needsWatering() {
    int soilMoisture = getSoilMoisturePercent();
    float temperature = getTemperatureC();
    
    if (soilMoisture < 30) {
        return true;
    } else if (soilMoisture < 40 && temperature > 25) {
        return true;
    }
    
    return false;
}

void SensorManager::setSoilCalibration(int dryValue, int wetValue) {
    _dryValue = dryValue;
    _wetValue = wetValue;
    Serial.print("Soil calibration updated: Dry=");
    Serial.print(dryValue);
    Serial.print(", Wet=");
    Serial.println(wetValue);
}

void SensorManager::setLightThresholds(int openThreshold, int closeThreshold) {
    _lightOpenThreshold = openThreshold;
    _lightCloseThreshold = closeThreshold;
    Serial.print("Light thresholds updated: Open=");
    Serial.print(openThreshold);
    Serial.print("%, Close=");
    Serial.print(closeThreshold);
    Serial.println("%");
}

void SensorManager::setTemperatureThresholds(float openTemp, float closeTemp) {
    _tempOpenThreshold = openTemp;
    _tempCloseThreshold = closeTemp;
    Serial.print("Temperature thresholds updated: Open=");
    Serial.print(openTemp, 1);
    Serial.print("°C, Close=");
    Serial.print(closeTemp, 1);
    Serial.println("°C");
}

float SensorManager::getVaporPressureDeficit() {
    float tempC = getTemperatureC();
    float humidity = getHumidity();
    
    if (tempC < 0 || humidity < 0) return 0.0;
    
    float es = 0.6108 * exp((17.27 * tempC) / (tempC + 237.3));
    float ea = (humidity / 100.0) * es;
    float vpd = es - ea;
    
    return vpd;
}

String SensorManager::getOverallPlantHealth() {
    float vpd = getVaporPressureDeficit();
    int soilMoisture = getSoilMoisturePercent();
    float tempC = getTemperatureC();
    
    int score = 0;
    
    if (vpd >= 0.8 && vpd <= 1.2) score += 3;
    else if (vpd >= 0.5 && vpd <= 1.5) score += 2;
    else if (vpd >= 0.3 && vpd <= 2.0) score += 1;
    
    if (soilMoisture >= 40 && soilMoisture <= 60) score += 3;
    else if (soilMoisture >= 30 && soilMoisture <= 70) score += 2;
    else if (soilMoisture >= 20 && soilMoisture <= 80) score += 1;
    
    if (tempC >= 18 && tempC <= 25) score += 3;
    else if (tempC >= 15 && tempC <= 28) score += 2;
    else if (tempC >= 10 && tempC <= 30) score += 1;
    
    if (score >= 8) return "EXCELLENT";
    else if (score >= 6) return "GOOD";
    else if (score >= 4) return "FAIR";
    else return "POOR - Needs attention";
}

bool SensorManager::isShadeMoving() {
    return _isShadeMoving;
}