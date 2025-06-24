// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = new Map();

app.use(express.static(__dirname + "/public")); // your HTML file inside 'public'

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("ready", () => {
    let partner = null;
    for (let [id, isAvailable] of users) {
      if (isAvailable && id !== socket.id) {
        partner = id;
        break;
      }
    }

    if (partner) {
      users.set(partner, false);
      users.set(socket.id, false);
      socket.partner = partner;
      io.to(partner).emit("startCall");
      socket.emit("startCall");
    } else {
      users.set(socket.id, true);
    }
  });

  socket.on("offer", (data) => {
    if (socket.partner) io.to(socket.partner).emit("offer", data);
  });

  socket.on("answer", (data) => {
    if (socket.partner) io.to(socket.partner).emit("answer", data);
  });

  socket.on("candidate", (data) => {
    if (socket.partner) io.to(socket.partner).emit("candidate", data);
  });

  socket.on("message", (msg) => {
    if (socket.partner) io.to(socket.partner).emit("message", msg);
  });

  socket.on("next", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("partner-disconnected");
      users.set(socket.partner, true);
      users.set(socket.id, true);
      socket.partner = null;
    }
    socket.emit("ready");
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("partner-disconnected");
      users.set(socket.partner, true);
    }
    users.delete(socket.id);
    console.log("Disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
