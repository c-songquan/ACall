const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {}; // username -> ws

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === 'join') {
      ws.username = data.username;
      users[ws.username] = ws;
      broadcastUsers();
    }

    // 转发 WebRTC 信令 (offer/answer/candidate)
    if (['offer', 'answer', 'candidate'].includes(data.type)) {
      if (data.target && users[data.target]) {
        users[data.target].send(JSON.stringify({
          ...data,
          from: ws.username
        }));
      }
    }
  });

  ws.on('close', () => {
    if (ws.username) {
      delete users[ws.username];
      broadcastUsers();
    }
  });
});

function broadcastUsers() {
  const list = Object.keys(users);
  const msg = JSON.stringify({ type: 'users', users: list });
  for (let u in users) {
    users[u].send(msg);
  }
}

app.use(express.static('public'));

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
