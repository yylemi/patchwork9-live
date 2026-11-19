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
  createCanvas(windowWidth, windowHeight);

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
}


// ---------------------------------------------------------------
// 4. DEALING THE PIECES (the "cut and paste")
// ---------------------------------------------------------------

// Makes a fresh collage. Positions and sizes are saved as shares of
// the page (0 to 1), not pixels.
// WHY: if the window changes size, the collage still fits, with no extra code.
function deal() {
  pieces = [];

  // Biggest size first, then smaller. Every PNG gets one copy of each size.
  for (const size of SIZES) {
    for (const img of cutouts) {
      pieces.push({
        img: img,
        x: random(0.15, 0.85),        // spread over the page, but not hanging off the edge
        y: random(0.15, 0.85),
        size: size,
        angle: random(-TILT, TILT),
        alpha: random(FAINTEST, 1),
      });
    }
  }

  // The anchor: the very first piece sits in the middle, straight and solid.
  // WHY: a pile of overlapping pieces needs one calm piece the eye lands on
  // first. Everything else is then read as arranged around it.
  pieces[0].x = 0.5;
  pieces[0].y = 0.5;
  pieces[0].angle = 0;
  pieces[0].alpha = 1;

  // The one-of-a-kind pieces go in LAST, one copy each.
  // WHY last: pieces are drawn in list order, so the last ones end up
  // on top of the pile, like the final thing you glue down.
  // "solo: true" is the label that tells draw() not to multiply them.
  for (const img of oneOffs) {
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

  redraw();
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
    const w = p.size * width;
    image(p.img, 0, 0, w, w * p.img.height / p.img.width);

    pop();                               // put the page back straight for the next piece
  }
}


// ---------------------------------------------------------------
// 6. MOVING PIECES BY HAND
// ---------------------------------------------------------------

// Pick up the piece whose middle is closest to the mouse.
// WHY "closest middle": the pieces are see-through and overlap, so
// "the one under the mouse" would need a lot of code to work out.
// Closest middle is one line and feels right.
function mousePressed() {
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
  redraw();
}

function mouseReleased() {
  held = null;
}


// ---------------------------------------------------------------
// 7. KEYS AND WINDOW
// ---------------------------------------------------------------
function keyPressed() {
  if (key === ' ') deal();                              // space: throw the pieces again
  if (key === 's' || key === 'S') saveCanvas('patchwork9', 'png');   // S: keep this one
}

// If the window changes size, the page follows. The pieces are stored
// as shares of the page, so they land in the right place by themselves.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
