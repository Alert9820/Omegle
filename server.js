// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waiting = null;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('ready', () => {
    if (waiting) {
      // Pair with the waiting user
      socket.partner = waiting;
      waiting.partner = socket;

      waiting.emit('startCall');
      socket.emit('startCall');

      waiting = null;
    } else {
      waiting = socket;
    }
  });

  socket.on('offer', (data) => {
    if (socket.partner) {
      socket.partner.emit('offer', data);
    }
  });

  socket.on('answer', (data) => {
    if (socket.partner) {
      socket.partner.emit('answer', data);
    }
  });

  socket.on('candidate', (data) => {
    if (socket.partner) {
      socket.partner.emit('candidate', data);
    }
  });

  socket.on('next', () => {
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit('disconnect');
      socket.partner = null;
    }
    socket.emit('ready');
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('disconnect');
      socket.partner.partner = null;
    }
    if (waiting === socket) {
      waiting = null;
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
