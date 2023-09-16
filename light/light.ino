#include <ArduinoWebsockets.h>

#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

using namespace websockets;

const char *ssid = "";
const char *password = "";

#define GPIO0 0
#define GPIO2 2
#define OFF 0
#define ON 1

int status[] = { HIGH, 0, LOW };  // GPIO0: 0, GPIO2: 2

void light(int gpio, int status) {
  digitalWrite(gpio, status);
}

String getStatus() {
  String message = "0: ";
  message += status[0];
  message += "\n2: ";
  message += status[2];
  return message;
}
WebsocketsClient client;
int WebsocketsServerStatus = OFF;
void onMessageCallback(WebsocketsMessage message) {
  Serial.print("Got Message: ");
  Serial.println(message.data());
  String data = message.data();
  int gpio = atoi((char *)data.substring(0, 1).c_str());
  int status = atoi((char *)data.substring(1, 2).c_str());
  if ((gpio != 0 && gpio != 2) || (status != 0 && status != 1)) {
    client.send("Success! " + data);
    return;
  }
  light(gpio, status);
  client.send(getStatus());
}

void onEventsCallback(WebsocketsEvent event, String data) {
  if (event == WebsocketsEvent::ConnectionOpened) {
    WebsocketsServerStatus = ON;
    Serial.println("WebSockets Server Connected!");
    // Send a message
    client.send("Hello Server!");
    client.send(getStatus());
  } else if (event == WebsocketsEvent::ConnectionClosed) {
    WebsocketsServerStatus = OFF;
    Serial.println("Websockets Server Closed!");
  } else if(event == WebsocketsEvent::GotPing) {
    Serial.println("Got a Ping!");
  }
}
void connectWS() {
  // Setup Callbacks
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);

  // Connect to server
  client.connect("wss://0.0.0.0/cb1cc77a-bbd1-48af-a6a7-5f969e62058b");

  Serial.println("Websockets Server Connecting...");
}

void setup(void) {
  pinMode(GPIO0, OUTPUT);
  pinMode(GPIO2, OUTPUT);
  light(GPIO0, status[GPIO0]);
  light(GPIO2, status[GPIO2]);

  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.println("");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (MDNS.begin("esp8266")) {
    Serial.println("MDNS responder started");
  }
  connectWS();
}
void loop(void) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected!");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi reconnecting...");
      delay(3000);
    }
    Serial.println("WiFi reconnected!");
  }
  while (WebsocketsServerStatus == OFF) {
    if (WiFi.status() != WL_CONNECTED) break;
    connectWS();
    delay(5000);
  }
  client.poll();
}