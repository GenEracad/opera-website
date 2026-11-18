import type { CSSProperties } from "react";

/**
 * Per-person tweaks for the team grid, so wide shots (half or full body) are
 * cropped to head and shoulders like the rest.
 *
 * Keyed by the person's name (not the photo file), so re-uploading the same
 * photo keeps its framing. If someone gets a genuinely different photo, check
 * its entry: `face` is the centre of the face as a % of the default 3:4 crop;
 * `zoom` scales the photo so the face ends up where it sits in the tightly
 * framed portraits.
 */
type Framing = { face?: [x: number, y: number]; zoom?: number; brightness?: number };

const FRAMING: Record<string, Framing> = {
  "eduardo-fontes": { face: [51, 20], zoom: 1.55 },
  "sofia-fontes": { face: [48, 40], zoom: 1.6, brightness: 1.25 },
  "alexandra-reis": { face: [46, 38], zoom: 2.2 },
  "sara-marcal": { face: [57, 47], zoom: 2.2 },
  "catarina-velez": { face: [53, 31], zoom: 1.4 },
  // Also crops the white border of the photo.
  "mariana-simao": { face: [49, 35], zoom: 1.45 },
  "ana-farto": { face: [52, 44], zoom: 1.5 },
  "tome-henriques": { face: [58, 42], zoom: 1.4 },
};

/** Where the face sits in the tightly framed portraits (Tomás, Cláudia). */
const TARGET: [number, number] = [50, 38];

const clamp = (v: number) => Math.min(100, Math.max(0, v));

const nameKey = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Inline style for a team member's photo: zoom around the point that moves
 * the face to TARGET (kept inside the frame, so the photo always covers it),
 * plus the grayscale filter with any brightness tweak. */
export function teamPhotoStyle(memberName: string): CSSProperties {
  const framing = FRAMING[nameKey(memberName)];
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
