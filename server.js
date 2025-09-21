const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 心跳接口，防止 Render 休眠
app.get("/ping", (req, res) => res.send("pong"));

let users = {}; // { socket.id: username }

io.on("connection", (socket) => {
  console.log("用户已连接:", socket.id);

  // 登录
  socket.on("login", (username) => {
    users[socket.id] = username;
    io.emit("userlist", Object.values(users));
  });

  // 断开
  socket.on("disconnect", () => {
    console.log("用户断开:", socket.id);
    delete users[socket.id];
    io.emit("userlist", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ 服务器运行在 ${PORT}`));
