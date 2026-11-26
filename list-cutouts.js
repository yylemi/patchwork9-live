// Writes public/cutouts.json: every PNG in public/cutouts, except the bin icon.
// The gallery shows this list. It runs by itself before `npm start` and each deploy,
// so a new PNG dropped in the folder shows up in the gallery with nothing to edit.
const fs = require('fs');
const files = fs.readdirSync('public/cutouts')
  .filter(f => f.toLowerCase().endsWith('.png') && f !== 'trashasset1.png')
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
fs.writeFileSync('public/cutouts.json', JSON.stringify(files));
