// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { exec } = require('child_process');

// 🛠 Auto-install required packages (only runs once if missing)
exec('npm install express socket.io', (error, stdout, stderr) => {
if (error) {
console.error(Auto-install error: ${error.message});
return;
}
if (stderr) {
console.error(Auto-install stderr: ${stderr});
return;
}
console.log(✅ Dependencies installed:\n${stdout});
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const waitingQueue = [];
const partners = new Map();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
console.log('🔌 New user connected:', socket.id);

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

socket.on('offer', (offer) => {
const partnerId = partners.get(socket.id);
if (partnerId) io.to(partnerId).emit('offer', offer);
});

socket.on('answer', (answer) => {
const partnerId = partners.get(socket.id);
if (partnerId) io.to(partnerId).emit('answer', answer);
});

socket.on('candidate', (candidate) => {
const partnerId = partners.get(socket.id);
if (partnerId) io.to(partnerId).emit('candidate', candidate);
});

socket.on('message', (msg) => {
const partnerId = partners.get(socket.id);
if (partnerId) io.to(partnerId).emit('message', msg);
});

socket.on('next', () => {
disconnectPartner(socket);
socket.emit('ready'); // Re-enter the queue
});

socket.on('disconnect', () => {
console.log('❌ User disconnected:', socket.id);
disconnectPartner(socket);
const index = waitingQueue.indexOf(socket);
if (index !== -1) waitingQueue.splice(index, 1);
});

function disconnectPartner(socket) {
const partnerId = partners.get(socket.id);
if (partnerId) {
const partnerSocket = io.sockets.sockets.get(partnerId);
if (partnerSocket) partnerSocket.emit('disconnect');
partners.delete(partnerId);
partners.delete(socket.id);
}
}
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log("Server running on http://localhost:" + PORT);
});

Ye code dekho aur ache se bana ke do mujhe Server

  
