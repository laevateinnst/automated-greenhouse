#include "config.h"
#include "SensorManager.h"

unsigned long prev = 0;
const unsigned long interval = 5000; 
Mode mode = AUTO; 

SensorManager sensors(A0, 2, A1, DHT11);

void setup() {
  Serial.begin(9600);
  
  sensors.begin();
  utils.begin();
  
  Serial.println("========================================");
  Serial.println("Automated Herb Greenhouse System");
  Serial.println("========================================");
  Serial.println("Current Mode: AUTO");
  Serial.println("Monitoring Parameters:");
  Serial.println("- Soil Moisture Level");
  Serial.println("- Temperature & Humidity");
  Serial.println("- Light Intensity");
  Serial.println("- Automatic Watering");
  Serial.println("- Automatic Shade Control");
  Serial.println("");
  Serial.println("Available Commands:");
  Serial.println("AUTO         - Switch to automatic mode");
  Serial.println("SLEEP        - Switch to sleep mode");
  Serial.println("PUMP_ON      - Manual pump ON");
  Serial.println("PUMP_OFF     - Manual pump OFF");
  Serial.println("OPEN_SHADE   - Manual open shade");
  Serial.println("CLOSE_SHADE  - Manual close shade");
  Serial.println("STATUS       - View all sensor readings");
  Serial.println("========================================");
}

void loop() {
  unsigned long curr = millis();

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "AUTO") {
      mode = AUTO;
      Serial.println("Mode: AUTO - Automated herb greenhouse mode activated");
    }
    else if (cmd == "SLEEP") {
      mode = SLEEP;
      Serial.println("Mode: SLEEP - System in low-power sleep mode");
      utils.pumpOff(); 
      utils.closeShade(); // Close shade when sleeping
    }
    else if (cmd == "PUMP_ON") {
      Serial.println("Manual: Water pump turned ON");
      utils.pumpOn();
    }
    else if (cmd == "PUMP_OFF") {
      Serial.println("Manual: Water pump turned OFF");
      utils.pumpOff();
    }
    else if (cmd == "OPEN_SHADE") {
      Serial.println("Manual: Opening shade cover");
      utils.openShade();
    }
    else if (cmd == "CLOSE_SHADE") {
      Serial.println("Manual: Closing shade cover");
      utils.closeShade();
    }
    else if (cmd == "STATUS") {
      sensors.printAllReadings();
    }
    else {
      Serial.println("Unknown command. Available: AUTO, SLEEP, PUMP_ON, PUMP_OFF, OPEN_SHADE, CLOSE_SHADE, STATUS");
    }
  }

  if (curr - prev >= interval) {
    prev = curr;
    
    switch (mode) {
      case AUTO:
        Serial.println("AUTO MODE - Checking greenhouse conditions...");
        
        // Check and control watering
        if (sensors.needsWatering()) {
          Serial.println("Soil is dry - Starting watering cycle...");
          utils.pumpOn();
          delay(2000); 
          utils.pumpOff();
          Serial.println("Watering complete");
        }
        
        // Check and control shade based on light level
        int lightLevel = sensors.getLightLevelPercent();
        if (lightLevel > 80) {
          // Too bright - open shade to reduce light
          Serial.println("Light too bright - Opening shade");
          utils.openShade();
        } else if (lightLevel < 30) {
          // Too dark - close shade to retain heat/light
          Serial.println("Light too low - Closing shade");
          utils.closeShade();
        }
        
        // Print sensor readings every 30 seconds
        static unsigned long lastSensorPrint = 0;
        if (curr - lastSensorPrint >= 30000) {
          lastSensorPrint = curr;
          sensors.printAllReadings();
        }
        break;
        
      case SLEEP:
        Serial.println("SLEEP MODE - System sleeping...");
        utils.pumpOff();
        utils.closeShade(); // Ensure shade is closed in sleep mode
        break;
    }
  }
}