#include "WiFiController.h"

EspController controller;

void setup() {
  controller.begin();
}

void loop() {
  controller.loop();
}