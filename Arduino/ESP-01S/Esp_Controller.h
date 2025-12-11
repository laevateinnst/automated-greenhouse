#ifndef ESP_CONTROLLER_H
#define ESP_CONTROLLER_H

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

class Esp_Controller {
public:
    WiFiController();
    void begin();
    void loop();

private:
    static const int EEPROM_SIZE = 96;
    static const int SSID_ADDR = 0;
    static const int PASS_ADDR = 32;
    static const int MAX_LEN = 32;

    bool configMode = false;
    ESP8266WebServer server;

    WebSocketsClient webSocket;
    String lastSensorJson = "";
    unsigned long lastPostTime = 0;
    const unsigned long postInterval = 600000;

    String readStringFromEEPROM(int addr, int maxLen);
    void writeStringToEEPROM(int addr, const String &str, int maxLen);

    bool connectWiFiFromEEPROM();
    void startConfigAP();

    void handleCommand(const String& command);
    void webSocketEvent(WStype_t type, uint8_t* payload, size_t length);

    void sendLogToServer();
};

#endif