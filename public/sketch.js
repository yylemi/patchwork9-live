// ===============================================================
// PATCHWORK 9 / COLLAGE
//
// Three cut-outs (a mountain, a valley, some trees) are pasted on a
// white page, several times each, the way you would with scissors,
// paper and glue. Where two pieces overlap, they MULTIPLY: you see
// both at once, darker, like two slides held up to the light.
//
// One more piece is different: the cat. There is only one, and it is
// pasted solid on top, like the last thing you glue down.
//
// The whole sketch is: load the PNGs, deal 9 pieces + the cat, draw them.
// ===============================================================


// ---------------------------------------------------------------
// 1. SETTINGS (change these numbers to change the collage)
// ---------------------------------------------------------------

// The cut-outs. To use other PNGs, put them in the cutouts folder
// and write their names here.
const FILES = ['cutouts/mountain.png', 'cutouts/valley.png', 'cutouts/trees.png'];

// The one-of-a-kind pieces: a second class of item. Each appears
// exactly ONCE, and is pasted solid on top instead of multiplied.
// WHY a separate list: the landscapes are the "paper" of the collage,
// repeated and melting into each other. The cat is the subject. If it
// were multiplied it would sink into the dark trees and disappear,
// and three cats would make it a pattern, not a character.
const ONE_OFFS = ['cutouts/cat.png'];

// How wide a one-of-a-kind piece is, as a share of the page width.
const ONE_OFF_SIZE = 0.09;

// How wide each copy is, as a share of the page width.
// Three sizes = three copies of each PNG, so 3 x 3 = 9 pieces.
// WHY different sizes: in a collage, pieces of the same size all
// shout equally loud. Big, medium and small give the eye an order
// to read them in. Add a number to this list to get more copies.
// WHY not bigger: multiply darkens every overlap. Pieces as wide as
// the page all pile up in the middle and it turns to black mud.
const SIZES = [0.6, 0.4, 0.25];

// How far a piece may be turned, in degrees, either way.
// WHY so little: a piece glued by hand is never perfectly straight,
// but a mountain turned 90 degrees stops being a mountain.
const TILT = 8;

// The faintest a piece may be (1 = solid, 0 = invisible).
// WHY: lighter pieces look like thin tracing paper, darker ones
// like thick paper. Mixed together they give depth.
const FAINTEST = 0.5;

// How big the page is, in windows (3 = 3 windows across and 3 down).
const PAGE = 3;


// ---------------------------------------------------------------
// 2. THE THINGS WE REMEMBER
// ---------------------------------------------------------------
let cutouts = [];   // the 3 loaded landscape PNGs
let oneOffs = [];   // the loaded one-of-a-kind PNGs (the cat)
let pieces = [];    // every piece on the page: which PNG, where, how big, how tilted, how faint
let held = null;    // the piece the mouse is carrying right now (null = none)

// ---------------------------------------------------------------
// 3. LOADING AND STARTING
// ---------------------------------------------------------------

// p5 runs preload first and waits until every picture has arrived,
// so we never try to draw a picture that is still loading.
function preload() {
  cutouts = FILES.map(file => loadImage(file));
  oneOffs = ONE_OFFS.map(file => loadImage(file));
}

function setup() {
  createCanvas(windowWidth * PAGE, windowHeight * PAGE);

  // Place pictures by their middle, not their top-left corner.
  // WHY: a piece then turns around its own centre, like paper under a finger.
  imageMode(CENTER);

  // Angles in degrees (8) instead of radians (0.14): easier to read.
  angleMode(DEGREES);

  // A collage is a still picture. p5 normally redraws 60 times a second;
  // noLoop() stops that, and we call redraw() only when something changes.
  // WHY: less work for the computer, and nothing to keep track of over time.
  noLoop();

  deal();
  connect();
  buildGallery();
  window.scrollTo((width - windowWidth) / 2, (height - windowHeight) / 2);
}


// ---------------------------------------------------------------
// 4. DEALING THE PIECES (the "cut and paste")
// ---------------------------------------------------------------

// Makes a fresh collage. Positions and sizes are saved as shares of
// the page (0 to 1), not pixels.
// WHY: if the window changes size, the collage still fits, with no extra code.
function deal() {
  pieces = [];

  // Every landscape PNG gets one copy of each size.
  for (const img of cutouts) addRepeated(img);

  // The anchor: the very first piece sits in the middle, straight and solid.
  // WHY: a pile of overlapping pieces needs one calm piece the eye lands on
  // first. Everything else is then read as arranged around it.
  pieces[0].x = 0.5;
  pieces[0].y = 0.5;
  pieces[0].angle = 0;
  pieces[0].alpha = 1;

  // The one-of-a-kind pieces go in after, one copy each.
  for (const img of oneOffs) addOneOff(img);

  pieces.forEach((p, i) => p.id = i);
  redraw();
}

// Pastes one PNG as repeated, multiplied pieces: one copy per size.
// WHY its own function: deal() uses it for the landscapes, and the
// "add PNG" button uses it for yours. One recipe, used twice.
function addRepeated(img) {
  for (const size of SIZES) {
    // unshift = put at the START of the list (push would put it at the end).
    // WHY: pieces are drawn in list order, so the start is the bottom of
    // the pile. That keeps every new landscape UNDER the cat. For the
    // multiplied pieces the order changes nothing, so this costs nothing.
    pieces.unshift({
      img: img,
      x: random(0.15, 0.85),        // spread over the page, but not hanging off the edge
      y: random(0.15, 0.85),
      size: size,
      angle: random(-TILT, TILT),
      alpha: random(FAINTEST, 1),
    });
  }
}

// Pastes one PNG once, solid, on top.
// push = put at the END of the list, so it is drawn last, on top of
// the pile, like the final thing you glue down.
// "solo: true" is the label that tells draw() not to multiply it.
function addOneOff(img) {
  pieces.push({
    img: img,
    x: random(0.15, 0.85),
    y: random(0.15, 0.85),
    size: ONE_OFF_SIZE,
    angle: random(-TILT, TILT),
    alpha: 1,                       // always solid
    solo: true,
  });
}


// ---------------------------------------------------------------
// 4b. ADDING YOUR OWN PNGs (the two buttons in the corner)
// ---------------------------------------------------------------

// Called by the buttons in index.html. "files" are the PNGs you picked,
// "list" is cutouts or oneOffs, "add" is addRepeated or addOneOff.
// WHY the list too: deal() (Space) rebuilds the page from those two
// lists. Putting your PNG in the list means it survives a new collage.
function addPngs(files, list, add) {
  for (const file of files) {
    // The browser gives the picked file a temporary web address, so
    // p5 can load it exactly like a file from the cutouts folder.
    // The PNG never leaves your computer.
    loadImage(URL.createObjectURL(file), img => {
      list.push(img);
      add(img);      // paste it on the current page, without reshuffling the rest
      redraw();
    });
  }
}


// ---------------------------------------------------------------
// 4c. THE GALLERY (every PNG in the cutouts folder)
// ---------------------------------------------------------------

// How wide a gallery piece is when pasted, as a share of the page width.
const GALLERY_SIZE = 0.25;

// Pictures already loaded, by file name, so each PNG is loaded only once
// even if you paste it ten times.
const galleryImgs = {};

function galleryImg(src) {
  if (!galleryImgs[src]) galleryImgs[src] = loadImage(src, () => redraw());
  return galleryImgs[src];
}

// Ask the server which PNGs are in the folder and show one thumbnail each.
// loading="lazy": some PNGs are 15 MB, so only the ones you scroll to are fetched.
function buildGallery() {
  const grid = document.querySelector('#gallery .grid');
  fetch('/api/cutouts').then(r => r.json()).then(files => {
    for (const file of files) {
      const src = 'cutouts/' + encodeURIComponent(file);
      const thumb = document.createElement('img');
      thumb.src = src;
      thumb.title = file;
      thumb.loading = 'lazy';
      thumb.draggable = true;
      thumb.onclick = () => pasteFromGallery(src, 0.5, 0.5);         // click: paste in the middle
      thumb.ondragstart = e => e.dataTransfer.setData('text/plain', src);
      grid.appendChild(thumb);
    }
  });

  // Dropping a thumbnail on the page pastes it right where you let go.
  const cnv = document.querySelector('canvas');
  cnv.addEventListener('dragover', e => e.preventDefault());
  cnv.addEventListener('drop', e => {
    e.preventDefault();
    const src = e.dataTransfer.getData('text/plain');
    if (src.startsWith('cutouts/')) pasteFromGallery(src, e.offsetX / width, e.offsetY / height);
  });
}

// Paste one gallery PNG at (x, y), shares of the page. Then it is a piece
// like any other: drag it around, or drop it in the bin.
// WHY "src" is kept on the piece: other people's browsers need the file
// name to load the same picture when the piece is shared with them.
function pasteFromGallery(src, x, y) {
  const multiply = document.getElementById('galleryMultiply').checked;
  const p = {
    id: 'g' + Date.now() + Math.floor(Math.random() * 1e6),   // unique across everyone's browsers
    src: src,
    img: galleryImg(src),
    x: x,
    y: y,
    size: GALLERY_SIZE,
    angle: random(-TILT, TILT),
    alpha: 1,
    solo: !multiply,
  };
  // Same rule as the rest: solid pieces on top, multiplied ones underneath.
  if (p.solo) pieces.push(p); else pieces.unshift(p);
  socket.emit('add', pieceData(p));
  redraw();
}

// The part of a piece that can travel to other browsers (not the picture itself).
function pieceData(p) {
  return { id: p.id, src: p.src, x: p.x, y: p.y, size: p.size,
           angle: p.angle, alpha: p.alpha, solo: p.solo };
}

// Rebuild a gallery piece that someone else pasted.
function pieceFromData(d) {
  return Object.assign({ img: galleryImg(d.src) }, d);
}


// ---------------------------------------------------------------
// 5. DRAWING
// ---------------------------------------------------------------
function draw() {
  // Start from a clean white page. The page has to be painted the
  // normal way (BLEND), otherwise white would multiply with the old
  // drawing and nothing would be erased.
  blendMode(BLEND);
  background(255);

  // From here on, everything multiplies with what is under it.
  // Multiply can only darken, like stacking slides or printing ink on ink:
  //   - on the white page a piece keeps its own colours (colour x white = colour)
  //   - where two pieces overlap you see both, darker
  //   - the see-through part of a PNG changes nothing at all
  // WHY this and not plain see-through pieces: with plain opacity the top
  // piece hides the one below and overlaps go grey and milky. Multiply
  // keeps both pictures readable and the colours deep.
  // BONUS: because multiplying works the same in any order, it does not
  // matter which piece is "on top". So we never need to sort the pile.
  // The one exception: a "solo" piece (the cat) is pasted the normal
  // way (BLEND), so it covers what is under it and stays fully visible.
  for (const p of pieces) {
    blendMode(p.solo ? BLEND : MULTIPLY);

    push();                           // remember the page as it is...
    translate(p.x * width, p.y * height);   // ...move to where the piece goes
    rotate(p.angle);                        // ...turn the page a little

    // How faint this piece is. We ask the canvas directly instead of
    // using p5's tint(), because tint() recolours the whole picture
    // every time and is slow with big photos.
    drawingContext.globalAlpha = p.alpha;

    // Draw the piece. Width comes from its size; the height follows
    // from the picture's own shape, so it is never squashed.
    const w = p.size * windowWidth;
    image(p.img, 0, 0, w, w * p.img.height / p.img.width);

    pop();                               // put the page back straight for the next piece
  }
}


// ---------------------------------------------------------------
// 6. MOVING PIECES BY HAND
// ---------------------------------------------------------------

// Pick up the piece whose middle is closest to the mouse.
// (Clicks on the buttons are ignored, so pressing "add PNG" never
// grabs a piece by accident.)
// WHY "closest middle": the pieces are see-through and overlap, so
// "the one under the mouse" would need a lot of code to work out.
// Closest middle is one line and feels right.
function mousePressed(event) {
  if (event.target.tagName !== 'CANVAS' || !pieces.length) return;
  held = pieces[0];
  for (const p of pieces) {
    if (dist(mouseX, mouseY, p.x * width, p.y * height) <
        dist(mouseX, mouseY, held.x * width, held.y * height)) held = p;
  }

  // Remember where on the piece we grabbed it, so it does not jump
  // to the mouse but stays under the finger.
  held.grabX = held.x - mouseX / width;
  held.grabY = held.y - mouseY / height;
}

function mouseDragged() {
  if (!held) return;
  held.x = mouseX / width + held.grabX;
  held.y = mouseY / height + held.grabY;
  socket.emit('move', { id: held.id, x: held.x, y: held.y });
  redraw();
}

function mouseReleased() {
  if (held && dist(winMouseX, winMouseY, windowWidth - 60, windowHeight - 60) < 50) {
    pieces.splice(pieces.indexOf(held), 1); 
    socket.emit('remove', held.id);  // take this piece out of the list
    redraw();
  }
  held = null;
}


// ---------------------------------------------------------------
// 7. KEYS AND WINDOW
// ---------------------------------------------------------------
function keyPressed() {
  if (key === ' ') { deal(); sendLayout(); };                              // space: throw the pieces again
  if (key === 's' || key === 'S') saveCanvas('patchwork9', 'png');   // S: keep this one
}

// If the window changes size, the page follows. The pieces are stored
// as shares of the page, so they land in the right place by themselves.
function windowResized() {
  resizeCanvas(windowWidth * PAGE, windowHeight * PAGE);
  redraw();
}

let socket;

function connect() {
  socket = io();

  socket.on('layout', data => {
    if (!data) return sendLayout();
    deal();
    const dealt = pieces;
    pieces = data
      .map(d => d.src ? pieceFromData(d)                         // pasted from the gallery
                      : dealt[d.id] && Object.assign(dealt[d.id], d))  // part of the dealt collage
      .filter(p => p);
    redraw();
  });

  socket.on('add', d => {
    const p = pieceFromData(d);
    if (p.solo) pieces.push(p); else pieces.unshift(p);
    redraw();
  });

  socket.on('move', d => {
    const p = pieces.find(p => p.id === d.id);
    if (p) { p.x = d.x; p.y = d.y; redraw(); }
  });

  socket.on('remove', id => {
    pieces = pieces.filter(p => p.id !== id);
    redraw();
  });
}

function sendLayout() {
  socket.emit('layout', pieces.map(pieceData));
}