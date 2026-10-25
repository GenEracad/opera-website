// Stacked OPERA STUDIO logo, outlined to SVG.
//
//   OPE        Every letter is set at the same gap. RA starts under E,
//     RA       DIO under U, and STU shares OPE's left edge.
//   STU
//     DIO
//
// OPE and RA use the Book weight, STU and DIO the Light one. Glyphs become
// paths, so the site never serves the font itself.
//
// Usage: node scripts/make-logo.mjs <book.ttf> <light.ttf> <out.svg> [fill] [gap]
import opentype from "opentype.js";
import { writeFileSync } from "node:fs";

const [bookPath, lightPath, out, fill = "#fff", gapArg = "0.16"] = process.argv.slice(2);
const book = opentype.loadSync(bookPath);
const light = opentype.loadSync(lightPath);

const SIZE = 1000;
const cap = (book.tables.os2.sCapHeight || book.unitsPerEm * 0.7) * (SIZE / book.unitsPerEm);
const GAP = cap * Number(gapArg);
const LEADING = cap * 1.42;

const box = (f, ch) => f.charToGlyph(ch).getPath(0, 0, SIZE).getBoundingBox();
const placed = []; // [font, char, left edge x, row]

/** Sets `text` from `left` at the even gap; returns each letter's left edge. */
function run(f, text, left, row) {
  const lefts = [];
  let x = left;
  for (const ch of text) {
    const b = box(f, ch);
    placed.push([f, ch, x, row]);
    lefts.push(x);
    x += b.x2 - b.x1 + GAP;
  }
  return lefts;
}

// Every letter sits the same gap from its neighbour. OPE and STU share the
// left edge; RA starts under E and DIO under U.
const e = run(book, "OPE", 0, 0)[2];
run(book, "RA", e, 1);
const u = run(light, "STU", 0, 2)[2];
run(light, "DIO", u, 3);

let d = "";
let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
for (const [f, ch, left, row] of placed) {
  const b = box(f, ch);
  const p = f.charToGlyph(ch).getPath(left - b.x1, cap + row * LEADING, SIZE);
  d += p.toPathData(1);
  const pb = p.getBoundingBox();
  minx = Math.min(minx, pb.x1); miny = Math.min(miny, pb.y1);
  maxx = Math.max(maxx, pb.x2); maxy = Math.max(maxy, pb.y2);
}

const w = maxx - minx, h = maxy - miny;
const px = 22 / cap; // cap height of 22px at natural size, like the previous logo
writeFileSync(
  out,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minx.toFixed(1)} ${miny.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${(w * px).toFixed(2)}" height="${(h * px).toFixed(2)}" role="img" aria-label="Opera Studio"><path fill="${fill}" d="${d}"/></svg>\n`,
);
console.log(`wrote ${out}: ${(w * px).toFixed(1)}x${(h * px).toFixed(1)} px`);
