"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNav({
  homeLink,
  navLinks,
  localeToggle,
}: {
  homeLink: { href: string; label: string } | null;
  navLinks: { href: string; label: string }[];
  localeToggle: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  // Dark bars over light sections; the open menu sits on a dark overlay.
  const bar = open ? "bg-foreground" : "bg-foreground group-data-[theme=light]:bg-[#3a3733]";

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((o) => !o)}
        className="relative z-10 flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-px w-6 ${bar} transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-6 ${bar} transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>

      {open ? (
        <div className="fixed inset-0 top-0 z-0 flex flex-col items-center justify-center gap-8 bg-background">
          {homeLink ? (
            <Link
              href={homeLink.href}
              onClick={() => setOpen(false)}
              className="font-mono text-sm tracking-widest text-foreground"
            >
              {homeLink.label}
            </Link>
          ) : null}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-mono text-sm tracking-widest text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={localeToggle.href}
            onClick={() => setOpen(false)}
            className="rounded-full border border-border px-4 py-2 font-mono text-sm tracking-widest text-foreground"
          >
            {localeToggle.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
