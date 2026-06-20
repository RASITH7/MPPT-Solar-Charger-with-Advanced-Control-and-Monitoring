#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include "RTClib.h"

// Firebase and Wi-Fi Configurations
#define FIREBASE_HOST "https://mppt-charger-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define FIREBASE_AUTH "NFoON6QJOUrwA0IhW5andht5YogNNtd8ETLwLb7d"
#define WIFI_SSID "SLT-4G_D7FD36"
#define WIFI_PASSWORD "342C1405"

// Assign the GPIO pins (Irradiance pin removed)
const int PIN_V_PV   = 32;
const int PIN_V_BAT  = 33;
const int PIN_I_PV   = 34;
const int PIN_I_BAT  = 35;
const int PIN_TEMP   = 39;

// Object initializations
RTC_DS3231 rtc;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// FreeRTOS Data Structure for Queue (irrad removed)
struct SensorData {
  float v_pv;
  float v_bat;
  float i_pv;
  float i_bat;
  float temp;
  float p_pv;
  float p_bat;
  char timestamp[15];
};

QueueHandle_t dataQueue;

// Task Declarations
void TaskReadSensors(void *pvParameters);
void TaskFirebaseUpload(void *pvParameters);

void setup() {
  Serial.begin(115200);
  
  // CRITICAL: Set attenuation so ESP32 can read up to ~3.3V
  analogSetAttenuation(ADC_11db); 

  pinMode(PIN_V_PV, INPUT);
  pinMode(PIN_V_BAT, INPUT);
  pinMode(PIN_I_PV, INPUT);
  pinMode(PIN_I_BAT, INPUT);
  pinMode(PIN_TEMP, INPUT);

  Wire.begin();
  if (!rtc.begin()) {
    Serial.println("Error: RTC module not detected!");
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected to Wi-Fi Network!");

  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Create a queue capable of holding 5 SensorData structures
  dataQueue = xQueueCreate(5, sizeof(SensorData));

  // Create FreeRTOS Tasks
  xTaskCreatePinnedToCore(TaskReadSensors, "SensorTask", 4096, NULL, 3, NULL, 1);
  xTaskCreatePinnedToCore(TaskFirebaseUpload, "FirebaseTask", 8192, NULL, 2, NULL, 1);

  Serial.println("ESP32 #1 (NORMAL PV) Ready with FreeRTOS.");
}

void loop() {
  // Empty. FreeRTOS tasks handle everything.
  vTaskDelete(NULL); 
}

// --- TASK 1: High Priority Sensor Reading ---
void TaskReadSensors(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(2000); 

  for(;;) {
    int raw_v_pv   = analogRead(PIN_V_PV);
    int raw_v_bat  = analogRead(PIN_V_BAT);
    int raw_i_pv   = analogRead(PIN_I_PV);
    int raw_i_bat  = analogRead(PIN_I_BAT);
    int raw_temp   = analogRead(PIN_TEMP);

    SensorData data;

    // Universal Formulas
    data.v_pv   = (0.0074809f * (float)raw_v_pv)  + 1.1623665f;
    data.v_bat  = (0.0109851f * (float)raw_v_bat) + 1.7090000f;
    data.i_pv   = (0.0015431f * (float)raw_i_pv)  + 0.0000005f;
    data.i_bat  = (0.0013780f * (float)raw_i_bat) + 0.0000005f;
    data.temp   = (0.0800277f * (float)raw_temp)  + 8.5145434f;
    // Clamp negative noise
    if (data.v_pv < 0.0f)  data.v_pv = 0.0f;
    if (data.v_bat < 0.0f) data.v_bat = 0.0f;
    if (data.i_pv < 0.0f)  data.i_pv = 0.0f;
    if (data.i_bat < 0.0f) data.i_bat = 0.0f;

    data.p_pv  = data.v_pv * data.i_pv;
    data.p_bat = data.v_bat * data.i_bat;

    // RTC Timestamp
    DateTime now = rtc.now();
    int displayHour = now.hour();
    const char* ampm = "AM";
    if (displayHour >= 12) {
      ampm = "PM";
      if (displayHour > 12) displayHour -= 12;
    }
    if (displayHour == 0) displayHour = 12;
    sprintf(data.timestamp, "%02d:%02d:%02d %s", displayHour, now.minute(), now.second(), ampm);

    // Send to Queue
    xQueueSend(dataQueue, &data, portMAX_DELAY);

    // Wait until exactly 2000ms has passed since the last wake time
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// --- TASK 2: Medium Priority Firebase Upload ---
void TaskFirebaseUpload(void *pvParameters) {
  SensorData data;
  for(;;) {
    // Wait for data to arrive in the queue
    if(xQueueReceive(dataQueue, &data, portMAX_DELAY) == pdPASS) {
      if(Firebase.ready()) {
        FirebaseJson json;
        json.set("v_pv", data.v_pv);
        json.set("v_battery", data.v_bat);
        json.set("i_pv", data.i_pv);
        json.set("i_battery", data.i_bat);
        json.set("temperature", data.temp);
        json.set("p_pv", data.p_pv);
        json.set("p_battery", data.p_bat);
        json.set("timestamp", data.timestamp);

        if (Firebase.RTDB.setJSON(&fbdo, "/devices/esp32-normal", &json)) {
          Serial.println("[Firebase] esp32-normal synced successfully.");
        } else {
          Serial.println(fbdo.errorReason());
        }
      }
    }
  }
}