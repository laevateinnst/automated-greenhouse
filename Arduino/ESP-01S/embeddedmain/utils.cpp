#include "Utils.h"

Utils::Utils(byte pumpRelayPin, byte lightRelayPin) {
  _pumpRelayPin = pumpRelayPin;
  _lightRelayPin = lightRelayPin;
}

void Utils::begin() {
  pinMode(_pumpRelayPin, OUTPUT);
  pinMode(_lightRelayPin, OUTPUT);
  
  digitalWrite(_pumpRelayPin, HIGH);    
  digitalWrite(_lightRelayPin, HIGH);
  
  pinMode(2, INPUT_PULLUP);
  
  disableUnusedPins();
  
  Serial.println("Utils initialized for Herb Greenhouse");
}

void Utils::disableUnusedPins() {
  power_spi_disable();
  power_timer0_disable();
  power_timer2_disable();
  
  for (byte pin = 0; pin <= 13; pin++) {
    if (pin == 2 || pin == _pumpRelayPin || pin == _lightRelayPin) continue;
    pinMode(pin, INPUT);
  }
  
  byte analogPins[] = {A0, A1, A2, A3, A4, A5};
  for (byte i = 0; i < 6; i++) {
    byte pin = analogPins[i];
    pinMode(pin, INPUT);
  }
}

void wakeUp() {
}

void Utils::goToSleep() {
  set_sleep_mode(SLEEP_MODE_PWR_DOWN);
  sleep_enable();
  
  attachInterrupt(digitalPinToInterrupt(2), wakeUp, LOW);
  
  sleep_mode();
  
  detachInterrupt(digitalPinToInterrupt(2));
  sleep_disable();
  
  power_all_enable();
  Serial.println("Woke up from sleep");
}

void Utils::autoMode(SensorManager &sensor) {
  int soilMoisture = sensor.getSoilMoisturePercent();
  float temperature = sensor.getTemperatureC();
  float humidity = sensor.getHumidity();
  int lightLevel = sensor.getLightLevelPercent();
  
  Serial.print("{");
  Serial.print("\"soilMoisture\":"); Serial.print(soilMoisture); Serial.print(",");
  Serial.print("\"soilStatus\":\""); Serial.print(sensor.getSoilMoistureStatus()); Serial.print("\",");
  Serial.print("\"temperatureC\":"); Serial.print(temperature, 1); Serial.print(",");
  Serial.print("\"temperatureF\":"); Serial.print(sensor.getTemperatureF(), 1); Serial.print(",");
  Serial.print("\"humidity\":"); Serial.print(humidity, 1); Serial.print(",");
  Serial.print("\"lightLevel\":"); Serial.print(lightLevel); Serial.print(",");
  Serial.print("\"lightStatus\":\""); Serial.print(sensor.getLightLevelStatus()); Serial.print("\"");
  Serial.println("}");
  
  if (sensor.needsWatering()) {
    Serial.println("Soil is dry - Watering plants...");
    waterPlants();
  }
  
  if (lightLevel < 20) {
    Serial.println("Light level low - Turning on grow lights");
    lightOn();
  } else if (lightLevel > 70) {
    Serial.println("Light level sufficient - Turning off grow lights");
    lightOff();
  }
}

void Utils::printAllPins() {
  Serial.println("=== PIN STATUS ===");
  
  Serial.println("Digital Pins:");
  for (byte pin = 0; pin <= 13; pin++) {
    if (pin != _pumpRelayPin && pin != _lightRelayPin) {
      pinMode(pin, INPUT_PULLUP);
    }
    int state = digitalRead(pin);
    Serial.print("  D");
    Serial.print(pin);
    Serial.print(": ");
    Serial.println(state == HIGH ? "HIGH" : "LOW");
  }
  
  Serial.println("Analog Pins:");
  for (byte a = 0; a < 6; a++) {
    int value = analogRead(A0 + a);
    Serial.print("  A");
    Serial.print(a);
    Serial.print(": ");
    Serial.println(value);
  }
  Serial.println("=================");
}

void Utils::pumpOn() {
  digitalWrite(_pumpRelayPin, LOW);
  Serial.println("Pump: ON");
}

void Utils::pumpOff() {
  digitalWrite(_pumpRelayPin, HIGH);
  Serial.println("Pump: OFF");
}

void Utils::lightOn() {
  digitalWrite(_lightRelayPin, LOW); 
  Serial.println("Grow Lights: ON");
}

void Utils::lightOff() {
  digitalWrite(_lightRelayPin, HIGH);
  Serial.println("Grow Lights: OFF");
}

void Utils::waterPlants(int durationMs) {
  pumpOn();
  delay(durationMs);
  pumpOff();
  Serial.print("Watering complete (");
  Serial.print(durationMs);
  Serial.println(" ms)");
}

void Utils::openShade();
  digitalWrite(SHADE_RELAY_PIN, LOW);
  Serial.println("Shade: Opened")

void Utils::closeShade();
  digitalWrite(SHADE_RELAY_PIN, HIGH);
  Serial.println("Shade: Closed")