const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Hand out everything in the public folder (index.html, sketch.js, cutouts)
app.use(express.static('public'));

// The gallery asks for this list: every PNG in public/cutouts, except the bin icon.
// WHY read the folder instead of writing the names by hand: drop a new PNG
// in the folder, reload the page, and it is in the gallery. Nothing to edit.
const fs = require('fs');
app.get('/api/cutouts', (req, res) => {
  const files = fs.readdirSync('public/cutouts')
    .filter(f => f.toLowerCase().endsWith('.png') && f !== 'trashasset1.png')
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  res.json(files);
});

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

  // Someone pasted a piece from the gallery: keep it, tell everyone else
  socket.on('add', d => {
    if (layout) d.solo ? layout.push(d) : layout.unshift(d);   // same pile order as the browsers
    socket.broadcast.emit('add', d);
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