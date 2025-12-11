#ifndef CONFIG_H
#define CONFIG_H




#define SOIL_MOISTURE_PIN  A1    
#define DHT_PIN            D10     
#define LIGHT_SENSOR_PIN   A0    
#define DHT_TYPE           DHT11 
#define SHADE_RELAY_PIN    D9
#define PUMP_RELAY_PIN     7     
#define LIGHT_RELAY_PIN    8     


#define SOIL_DRY_VALUE     1023  
#define SOIL_WET_VALUE     300   

#define WATERING_DURATION  2000  
#define WATERING_THRESHOLD 30    

#define LIGHT_ON_THRESHOLD 20    
#define LIGHT_OFF_THRESHOLD 70   

#define LOOP_INTERVAL      5000  
#define SENSOR_PRINT_INTERVAL 30000 

#include "SensorManager.h"
#include "Utils.h"

SensorManager sensor(SOIL_MOISTURE_PIN, DHT_PIN, LIGHT_SENSOR_PIN, DHT_TYPE);
Utils utils(PUMP_RELAY_PIN, LIGHT_RELAY_PIN, SHADE_RELAY_PIN);

enum Mode { AUTO, SLEEP };
Mode mode = AUTO;

unsigned long prev = 0;
const unsigned long interval = LOOP_INTERVAL;

#endif