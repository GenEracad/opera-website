"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Relative luminance-ish lightness (0–1) of a computed CSS colour, or null
 * when it's (mostly) transparent. Handles rgb()/rgba() and oklch(), which is
 * how browsers report the site's oklch theme colours. */
function lightness(color: string): number | null {
  const oklch = color.match(/^oklch\(\s*([\d.]+)(%?)[^/)]*(?:\/\s*([\d.]+)(%?))?\)/);
  if (oklch) {
    const alpha = oklch[3] === undefined ? 1 : Number(oklch[3]) / (oklch[4] ? 100 : 1);
    if (alpha < 0.5) return null;
    return Number(oklch[1]) / (oklch[2] ? 100 : 1);
  }
  const rgb = color.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\)/);
  if (rgb) {
    if (rgb[4] !== undefined && Number(rgb[4]) < 0.5) return null;
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((v) => Number(v) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return null;
}

/** Whether the page behind (x, y), ignoring the header itself, is a light
 * background. Photos count as dark, so the logo stays white over them. */
function isLightAt(x: number, y: number, header: HTMLElement): boolean {
  for (const el of document.elementsFromPoint(x, y)) {
    if (header.contains(el)) continue;
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement) {
      return false;
    }
    const l = lightness(getComputedStyle(el).backgroundColor);
    if (l !== null) return l > 0.6;
  }
  return false;
}

/** The fixed site header. Sets data-theme="light" while it sits over a light
 * section so the logo and menu (styled with group-data-[theme=light]:) switch
 * to their dark versions. */
export function HeaderShell({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();

  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const box = header.getBoundingClientRect();
      // Sample next to the logo, halfway down the header bar.
      setTheme(isLightAt(box.left + 48, box.top + Math.min(box.height / 2, 64), header) ? "light" : "dark");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    // Content that fades or loads in after navigation can change what's behind.
    const late = window.setTimeout(check, 600);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.clearTimeout(late);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return (
    <header ref={ref} data-theme={theme} className={`group ${className ?? ""}`}>
      {children}
    </header>
  );
}
