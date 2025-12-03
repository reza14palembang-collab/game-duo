const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {}; // {roomId:[ws1,ws2]}

wss.on('connection', ws => {
  ws.on('message', msg => {
    const data = JSON.parse(msg);
    if (data.type === 'join') {
      const room = data.room;
      if (!rooms[room]) rooms[room] = [];
      if (rooms[room].length >= 2) return ws.send(JSON.stringify({type:'full'}));
      rooms[room].push(ws);
      ws.room = room;
      ws.send(JSON.stringify({type:'joined',player:rooms[room].length}));
      rooms[room].forEach(client => {
        if (client !== ws) client.send(JSON.stringify({type:'ready'}));
      });
    }
    if (data.type === 'move' || data.type === 'attack') {
      const room = ws.room;
      if (!room) return;
      rooms[room].forEach(client => {
        if (client !== ws) client.send(JSON.stringify(data));
      });
    }
  });

  ws.on('close', () => {
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter(client => client !== ws);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));