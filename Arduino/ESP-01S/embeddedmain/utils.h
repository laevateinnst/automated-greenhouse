#ifndef UTILS_H
#define UTILS_H

#include <Arduino.h>
#include <avr/sleep.h>
#include <avr/power.h>
#include "SensorManager.h"

class Utils {
  private:
    byte _pumpRelayPin;
    byte _lightRelayPin; 
    
    void disableUnusedPins();
    
  public:
    Utils(byte pumpRelayPin, byte lightRelayPin);
    void begin();
    
    void pumpOn();
    void pumpOff();
    
    void lightOn();
    void lightOff();

    void openShade();
    void closeSahde();
    
    void autoMode(SensorManager &sensor);
    void printAllPins();
    
    void goToSleep();
    
    // Watering cycle
    void waterPlants(int durationMs = 2000); 
};

#endif