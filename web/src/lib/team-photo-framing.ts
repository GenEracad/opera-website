import type { CSSProperties } from "react";

/**
 * Per-photo tweaks for the team grid, so wide shots (half or full body) are
 * cropped to head and shoulders like the rest.
 *
 * Keyed by the photo file name: a replaced photo loses its tweak, since the
 * new one may already be framed well. `face` is the centre of the face as a
 * % of the default 3:4 crop; `zoom` scales the photo so the face ends up
 * where it sits in the tightly framed portraits.
 */
type Framing = { face?: [x: number, y: number]; zoom?: number; brightness?: number };

const FRAMING: Record<string, Framing> = {
  // Eduardo Fontes
  "433d8c8f-1c9c-4fc9-9c8a-1a31b9be298d.png": { face: [51, 20], zoom: 1.9 },
  // Sofia Fontes
  "d10776b1-05da-47ff-8ecb-e988dd272535.png": { face: [48, 40], zoom: 1.95, brightness: 1.25 },
  // Alexandra Reis
  "6046cdb0-2445-4964-a668-abd4ca99e309.jpg": { face: [46, 38], zoom: 2.2 },
  // Sara Marçal
  "45140f6f-7442-4f81-a555-83cf9b81e71f.jpg": { face: [57, 47], zoom: 2.2 },
  // Catarina Velez
  "6531bbb2-e3ba-40ef-a8e9-36f61edc3364.jpg": { face: [53, 31], zoom: 1.4 },
  // Mariana Simão (also crops the white border)
  "ca5e2bd4-3d76-4c55-8d77-3d6aa5b79186.jpg": { face: [49, 35], zoom: 1.45 },
  // Ana Farto
  "t11.jpg": { face: [52, 44], zoom: 1.5 },
  // Tomé Henriques
  "dcfe120b-90c3-4a7c-a0e3-d54075e3e50d.jpg": { face: [58, 42], zoom: 1.4 },
};

/** Where the face sits in the tightly framed portraits (Tomás, Cláudia). */
const TARGET: [number, number] = [50, 38];

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Inline style for a team photo: zoom around the point that moves the face
 * to TARGET (kept inside the frame, so the photo always covers it), plus the
 * grayscale filter with any brightness tweak. */
export function teamPhotoStyle(photoUrl: string): CSSProperties {
  const file = photoUrl.split("?")[0].split("/").pop() ?? "";
  const framing = FRAMING[file];
  if (!framing) return {};
  const style: CSSProperties = {};
  const zoom = framing.zoom ?? 1;
  if (framing.face && zoom > 1) {
    // A point P scaled by z around origin O lands on O + z(P - O); solve for
    // the origin that lands the face on TARGET.
    const [ox, oy] = framing.face.map((p, i) => clamp((TARGET[i] - zoom * p) / (1 - zoom)));
    style.transform = `scale(${zoom})`;
    style.transformOrigin = `${ox}% ${oy}%`;
  }
  if (framing.brightness) style.filter = `grayscale(1) brightness(${framing.brightness})`;
  return style;
}
