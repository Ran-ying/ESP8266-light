#include <ESP8266WiFi.h>
#include <PubSubClient.h>


const char *ssid = "中央政治局";
const char *password = "20011228";

#define GPIO0 0 //额外的io口
#define GPIO2 2 //自带的指示灯
#define OFF 0
#define ON 1

void connectWiFi(const char *ssid, const char *password){
  WiFi.begin(ssid, password);
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
}

void checkWiFi(const char *ssid, const char *password){
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
}


// 【改成你电脑的局域网IP！！】
const char* mqtt_server = "192.168.0.102";
const int   mqtt_port   = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// 收到 MQTT 消息时执行（服务器 → ESP）
void MQTTcallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("收到主题：");
  Serial.println(topic);

  char msg[200];
  for (int i = 0; i < length; i++) {
    msg[i] = (char)payload[i];
  }
  msg[length] = '\0';
  Serial.print("消息内容：");
  Serial.println(msg);

  // 服务器让灯亮
  if (strcmp(topic, "server/to/esp") == 0) {
    if (strcmp(msg, "亮灯") == 0) {
      analogWrite(GPIO2, 0);  // 亮
    } else {
      analogWrite(GPIO2, 1023); // 灭
    }
  }
}


void MQTTreconnect() {
  while (!client.connected()) {
    Serial.println("连接 MQTT...");
    if (client.connect("ESP8266_Client")) {
      Serial.println("MQTT 连接成功");
      client.subscribe("server/to/esp"); // 订阅服务器消息
    } else {
      delay(3000);
    }
  }
}


void setup() {
  // put your setup code here, to run once:
  pinMode(GPIO0, OUTPUT);
  pinMode(GPIO2, OUTPUT);
  digitalWrite(GPIO0, OFF);
  digitalWrite(GPIO2, ON);

  Serial.begin(115200);
  Serial.println("");
  Serial.println("Success!");

  connectWiFi(ssid, password);
  digitalWrite(GPIO2, OFF);


  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(MQTTcallback); // 绑定接收函数
  digitalWrite(GPIO2, ON);
}

void loop() {
  // put your main code here, to run repeatedly:

  checkWiFi(ssid, password);
  
  if (!client.connected()) MQTTreconnect();
  client.loop();

  // ESP 向服务器发送消息（每3秒）
  static unsigned long t = 0;
  if (millis() - t > 3000) {
    t = millis();
    client.publish("esp/to/server", "ESP 在线，灯正常");
  }
}
