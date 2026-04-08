const aedes = require('aedes')();
const net = require('net');

// 启动 MQTT 服务器
const server = net.createServer(aedes.handle);
const PORT = 1883;

server.listen(PORT, () => {
  console.log("==================================");
  console.log("✅ MQTT 服务器启动成功！端口：" + PORT);
  console.log("✅ 可发送：亮灯 / 灭灯");
  console.log("✅ 输入消息按回车发送");
  console.log("==================================");
});

// 监听设备连接
aedes.on('client', (client) => {
  console.log("📶 设备已连接：" + client.id);
});

// 监听 ESP 发来的消息
aedes.on('publish', (packet, client) => {
  if (client && packet.topic === "esp/to/server") {
    console.log("📥 ESP → 服务器：", packet.payload.toString());
  }
});

// ==============================================
// 你键盘输入 亮灯 / 灭灯 → 发给 ESP
// ==============================================
process.stdin.on('data', (input) => {
    console.log();
  const msg = input.toString().trim();

  if (msg === "亮灯" || msg === "灭灯") {
    aedes.publish({
      topic: "server/to/esp",
      payload: msg
    });
    console.log("📤 服务器 → ESP：" + msg);
  } else {
    console.log("❌ 请输入：亮灯 或 灭灯");
  }
});

setInterval(()=>{
    aedes.publish({
      topic: "server/to/esp",
      payload: (new Date()).toString()
    });
}, 1000)