const express = require('express'), http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express(), server = http.createServer(app), io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
const queue = [], partners = new Map();

io.on('connection', s => {
  console.log('New:', s.id);

  s.on('ready', () => {
    if (queue.length) {
      const p = queue.shift();
      partners.set(s.id, p.id);
      partners.set(p.id, s.id);
      s.emit('startCall');
      p.emit('startCall');
    } else queue.push(s);
  });

  ['offer','answer','candidate','message'].forEach(ev =>
    s.on(ev, data => {
      const pid = partners.get(s.id);
      if (pid) io.to(pid).emit(ev, data);
    })
  );

  s.on('next', () => {
    const pid = partners.get(s.id);
    if (pid) io.to(pid).emit('partner-disconnected');
    partners.delete(s.id);
    partners.delete(pid);
    s.emit('ready');
  });

  s.on('disconnect', () => {
    const pid = partners.get(s.id);
    if (pid) io.to(pid).emit('partner-disconnected');
    partners.delete(s.id);
    partners.delete(pid);
  });
});

server.listen(3000, () => console.log('Running on port 3000'));
