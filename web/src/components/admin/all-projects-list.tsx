"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { moveProjectOrder, setProjectPosition, toggleFeatured } from "@/app/admin/actions";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import type { Project } from "@/lib/content-store";

export function AllProjectsList({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          Todos os projetos
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {query ? `${filtered.length} / ${projects.length}` : projects.length}
        </span>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pesquisar por nome…"
        className="mb-6 w-full border-b border-border bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filtered.map((project) => {
            const fullIndex = projects.findIndex((p) => p.id === project.id);
            return (
            <div key={project.id} className="flex items-center gap-4 py-3">
              {!query ? (
                <div className="flex flex-col">
                  <form action={moveProjectOrder.bind(null, project.id, "up")}>
                    <button
                      type="submit"
                      disabled={fullIndex === 0}
                      className="font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveProjectOrder.bind(null, project.id, "down")}>
                    <button
                      type="submit"
                      disabled={fullIndex === projects.length - 1}
                      className="font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                </div>
              ) : null}
              {/* Type a position and press Enter (or leave the field) to jump there. */}
              <form
                action={setProjectPosition.bind(null, project.id)}
                title="Posição — escreva o número e carregue Enter"
              >
                <input
                  key={fullIndex}
                  type="number"
                  name="position"
                  min={1}
                  max={projects.length}
                  defaultValue={fullIndex + 1}
                  aria-label={`Posição de ${project.name}`}
                  onBlur={(e) => {
                    if (Number(e.currentTarget.value) !== fullIndex + 1) e.currentTarget.form?.requestSubmit();
                  }}
                  className="w-12 border-b border-border bg-transparent py-1 text-center font-mono text-xs text-foreground [appearance:textfield] focus:border-foreground/60 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </form>
              <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-secondary">
                <Image
                  src={project.images[0]}
                  alt={project.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {project.name}
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {[project.category, project.location].filter(Boolean).join(" · ")}
                  {" · "}
                  {project.images.length} img{project.images.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <form action={toggleFeatured.bind(null, project.id, true)}>
                  <button
                    type="submit"
                    className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Destacar
                  </button>
                </form>
                <Link
                  href={`/admin/projetos/${project.id}`}
                  className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Editar
                </Link>
                <DeleteProjectButton id={project.id} name={project.name} />
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
