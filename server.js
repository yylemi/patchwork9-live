const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Hand out everything in the public folder (index.html, sketch.js, cutouts)
app.use(express.static('public'));

// The server remembers the shared collage, so newcomers see the same one
let layout = null;

io.on('connection', socket => {
  // Someone arrives: send them the current collage (or null if there is none yet)
  socket.emit('layout', layout);

  // Someone dealt a new collage (Space): remember it, send it to everyone else
  socket.on('layout', data => {
    layout = data;
    socket.broadcast.emit('layout', data);
  });

  // Someone moved a piece: update our copy, tell everyone else
  socket.on('move', d => {
    const p = layout && layout.find(p => p.id === d.id);
    if (p) { p.x = d.x; p.y = d.y; }
    socket.broadcast.emit('move', d);
  });

  // Someone binned a piece: remove it, tell everyone else
  socket.on('remove', id => {
    if (layout) layout = layout.filter(p => p.id !== id);
    socket.broadcast.emit('remove', id);
  });
});

// Online, the host chooses the port. On your Mac it's 3000.
http.listen(process.env.PORT || 3000);