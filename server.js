const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const waitingQueue = [];
const partners = new Map();

io.on('connection', socket => {
  console.log("New connection:", socket.id);

  socket.on('ready', () => {
    if (waitingQueue.length > 0) {
      const peer = waitingQueue.shift();
      partners.set(socket.id, peer.id);
      partners.set(peer.id, socket.id);
      socket.emit('startCall');
      peer.emit('startCall');
    } else {
      waitingQueue.push(socket);
    }
  });

  socket.on('offer', offer => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('offer', offer);
  });

  socket.on('answer', answer => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('answer', answer);
  });

  socket.on('candidate', candidate => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('candidate', candidate);
  });

  socket.on('message', msg => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('message', msg);
  });

  socket.on('next', () => {
    disconnect(socket);
    socket.emit('ready');
  });

  socket.on('disconnect', () => {
    console.log("Disconnected:", socket.id);
    disconnect(socket);
  });

  function disconnect(socket) {
    const partnerId = partners.get(socket.id);
    if (partnerId) {
      const partner = io.sockets.sockets.get(partnerId);
      if (partner) partner.emit('disconnect');
      partners.delete(partnerId);
      partners.delete(socket.id);
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
