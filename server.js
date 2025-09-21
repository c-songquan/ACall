const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {}; // { username: ws }

// 心跳接口，防止 Render 休眠
app.get("/ping", (req, res) => res.send("pong"));

// 提供静态页面
app.use(express.static("public"));

wss.on("connection", (ws) => {
  console.log("用户已连接");

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === "join") {
      ws.username = data.username;
      users[ws.username] = ws;
      console.log("用户加入:", data.username);
      broadcastUsers();
    }

    // 转发 WebRTC 信令 (offer/answer/candidate)
    if (["offer", "answer", "candidate"].includes(data.type)) {
      if (data.target && users[data.target]) {
        users[data.target].send(
          JSON.stringify({
            ...data,
            from: ws.username,
          })
        );
      }
    }
  });

  ws.on("close", () => {
    if (ws.username) {
      console.log("用户断开:", ws.username);
      delete users[ws.username];
      broadcastUsers();
    }
  });
});

// 广播在线用户列表
function broadcastUsers() {
  const list = Object.keys(users);
  const msg = JSON.stringify({ type: "users", users: list });
  for (let u in users) {
    users[u].send(msg);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ 服务器已启动 http://localhost:${PORT}`)
);
