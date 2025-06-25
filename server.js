const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const waiting = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('🔗 Connected:', socket.id);

  socket.on('ready', () => {
    if (waiting.length > 0) {
      const peer = waiting.shift();
      socket.peer = peer.id;
      peer.peer = socket.id;
      socket.emit('startCall');
      peer.emit('startCall');
    } else {
      waiting.push(socket);
    }
  });

  socket.on('offer', (data) => {
    const peerId = socket.peer;
    if (peerId) io.to(peerId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    const peerId = socket.peer;
    if (peerId) io.to(peerId).emit('answer', data);
  });

  socket.on('candidate', (data) => {
    const peerId = socket.peer;
    if (peerId) io.to(peerId).emit('candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    const index = waiting.indexOf(socket);
    if (index !== -1) waiting.splice(index, 1);
    if (socket.peer) io.to(socket.peer).emit('disconnect');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
