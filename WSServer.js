let serverConfig = {
    "secret":"cb1cc77a",
    "IP":"127.0.0.1",
    "PORT": 15000
}
//00 GPIO0亮
//01 GPIO0灭
//21 GPIO2亮
//20 GPIO2灭
var IP = serverConfig.IP;
var PORT = serverConfig.PORT;

var http = require("http").createServer(function (request, response) {
    console.log(request.url); // 获取请求路径（包含查询字符串）
    switch(request.url){
        case "/":
        case "/index.html":
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(`<!DOCTYPE html>
            <html lang='en'>
            
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Light</title>
                <script>
                    let rotating = false;
                    let light = (gpio, status) => {
                        if (!rotating) {
                            fetch('/light').then(data => data.text()).then(data => { check(data); })
                            document.getElementById('backgroundBorder').classList.add("move");
                            rotating = true;
                            setTimeout(() => {
                                document.getElementById('backgroundBorder').classList.remove("move");
                                rotating = false;
                            }, 1100);
                        }
                    }
                    window.onload = () => {
                        fetch('/status').then(data => data.text()).then(data => { check(data); })
                        setInterval(()=>{
                            fetch('/status').then(data => data.text()).then(data => { check(data); })
                        }, 5000);
                    }
                    let check = (data) => {
                        if (data == 'Device offline!') {
                            document.getElementById('button').innerHTML = '离线';
                            document.getElementById('button').disabled = true;
                        }
                        else {
                            document.getElementById('button').innerHTML = data;
                            document.getElementById('button').disabled = false;
                        }
                    }
                </script>
                <style>
                    #button:disabled {
                        background-color: #510;
                    }
                    #button:enabled {
                        background-color: #333;
                    }
                    .move {
                        animation: 1s move;
                    }
            
                    @keyframes move {
                        0% {
                            transform: rotate(0deg);
                        }
            
                        100% {
                            transform: rotate(360deg);
                        }
                    }
                </style>
            </head>
            
            <body style="width: 100%; margin: 0px; background-color: #111;">
            <div style="text-align: center; margin-top: 100px; font-size: 30px; color: #eee;">Light</div>
            <div style="width: 110px; height: 110px; margin: 20px auto; text-align: center; position: relative;">
                <div id="backgroundBorder"
                    style="display: inline-block; width: 110px; height: 110px; background-image: linear-gradient(to top, #cc208e 0%, #6713d2 100%); border-radius: 100px; position: absolute; left: 0px; top: 0px;">
                </div>
                <button id="button" onclick='light()'
                    style="display: inline-block; width: 100px; height: 100px; border-radius: 100px; line-height: 100px; cursor: pointer; user-select: none;  left: 5px; top: 5px; position: absolute; font-size: 40px; color: #eee; border: 0px;">0
                </button>
            </div>
            </body>

            </html>`);
            break;
        case "favicon.ico":
            response.end();
            break;
        case "/light":
            if(DeviceStatus()){
                GPIO2Light();
                response.end(GPIO2Times.toString());
            }
            else {
                //response.end((++GPIO2Times).toString());
                response.end("Device offline!");
            }
            break;
        case "/status":
            if(DeviceStatus()){
                response.end(GPIO2Times.toString());
            }
            else {
                //response.end((++GPIO2Times).toString());
                response.end("Device offline!");
            }
            break;
        case `/${secret}`:
            break;
        default:
            response.end('404');
    }
}).listen(PORT, IP);

var websocketsServer = require('ws').Server;
var server = new websocketsServer({
    server: http
})
var websocketsConnection = null;
var light = (arg)=>{
    if(DeviceStatus())
    websocketsConnection.send(arg);
}
let GPIO2Times = require('fs').readFileSync('./GPIO2.txt');
var GPIO2Status = false;
var GPIO2Timeout;
var DeviceStatus = ()=>{
    if(!websocketsConnection) return false;
    return true;
}
var GPIO2Light = ()=>{

    GPIO2Times++;
    if(GPIO2Status){
        clearTimeout(GPIO2Timeout);
    }
    else{
        GPIO2Status = true;
        light('21');
    }
    GPIO2Timeout = setTimeout(()=>{
        console.log("OFF");
        GPIO2Status = false;
        light('20');
        require('fs').writeFileSync('./GPIO2.txt', GPIO2Times.toString());
    },3000);
}
server.on('connection', (ws, req) => {
    var url = req.url.split('/');
    var clientSECRET = url[1];
    if(clientSECRET != serverConfig.secret){
        ws.close();
        return;
    }
    websocketsConnection = ws;
    if(url.length == 2){
        console.log(`client ${clientSECRET} connect!`)
        // let i = 0;
        // let sI = setInterval(()=>{
        //     if(i == 0)
        //     clearInterval(sI);
        //     console.log(`Loop ${i++}\n`);
        //     light('00');
        //     light('21');
        //     setTimeout(()=>{
        //         light('01');
        //         light('20');
        //     },500);
        // },1000);

        let interval = setInterval(()=>{
            ws.ping();
        }, 10000);
        
        ws.on('message',(data)=>{
            console.log(data.toString());
        })
        ws.on('close',()=>{
            console.log('client close connection');
            clearInterval(interval);
            websocketsConnection = null;
        })
        ws.on('error',()=>{
            console.log('Error!');
            // websocketsConnection = null;
        })
    }
});
server.on('close',()=>{

})

// 终端打印如下信息
console.log(`Server running at http://${IP}:${PORT}/`);