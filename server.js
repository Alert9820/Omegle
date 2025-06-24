// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Store waiting users and pairs
const waitingQueue = [];
const partners = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // When a user is ready to be paired
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

  // Handle WebRTC offer
  socket.on('offer', (offer) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('offer', offer);
  });

  // Handle WebRTC answer
  socket.on('answer', (answer) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('answer', answer);
  });

  // Handle ICE candidates
  socket.on('candidate', (candidate) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('candidate', candidate);
  });

  // Chat messaging
  socket.on('message', (msg) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) io.to(partnerId).emit('message', msg);
  });

  // Next button
  socket.on('next', () => {
    disconnectPartner(socket);
    socket.emit('ready'); // Go back to queue
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    disconnectPartner(socket);

    // Remove from queue if present
    const index = waitingQueue.findIndex(s => s.id === socket.id);
    if (index !== -1) waitingQueue.splice(index, 1);
  });

  // Disconnect logic
  function disconnectPartner(socket) {
    const partnerId = partners.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('disconnect');
        partners.delete(partnerId);
      }
    }
    partners.delete(socket.id);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is live on http://localhost:${PORT}`);
});
