"use client";

import Image from "next/image";
import { useState } from "react";

import type { FormState } from "@/app/admin/actions";
import { useUploadingAction } from "@/lib/browser-upload";
import type { Project } from "@/lib/content-store";

const inputClass =
  "w-full border-b border-border bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none";
const labelClass = "mb-2 block font-mono text-xs tracking-widest text-muted-foreground";

const CATEGORIES = [
  "Escolas",
  "Habitação",
  "Equipamentos Públicos",
  "Certificações Energéticas",
  "Revisões de Projeto",
];

export function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  project?: Project;
  submitLabel: string;
}) {
  const { submit, uploading, pending, error } = useUploadingAction(action, {});
  const [imagesToRemove, setImagesToRemove] = useState<Set<string>>(new Set());
  // Current images in display order; dragged or nudged here, saved as
  // imageOrder. The first one is the project's cover.
  const [order, setOrder] = useState<string[]>(project?.images ?? []);
  const [dragging, setDragging] = useState<number | null>(null);

  const remainingCount = (project?.images.length ?? 0) - imagesToRemove.size;

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    setOrder((prev) => {
      const next = [...prev];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
  }

  return (
    <form action={submit} className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={project?.name}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="nameEn">
          Nome (EN)
        </label>
        <input
          id="nameEn"
          name="nameEn"
          defaultValue={project?.nameEn}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="category">
          Categoria
        </label>
        <select
          id="category"
          name="category"
          defaultValue={project?.category ?? ""}
          className={inputClass}
        >
          <option value="" className="bg-background text-foreground">
            Selecionar categoria…
          </option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category} className="bg-background text-foreground">
              {category}
            </option>
          ))}
          {project?.category && !CATEGORIES.includes(project.category) ? (
            <option value={project.category} className="bg-background text-foreground">
              {project.category}
            </option>
          ) : null}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="location">
          Localização
        </label>
        <input
          id="location"
          name="location"
          defaultValue={project?.location}
          placeholder="Cidade · Município"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={project?.description}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="descriptionEn">
          Descrição (EN)
        </label>
        <textarea
          id="descriptionEn"
          name="descriptionEn"
          rows={5}
          defaultValue={project?.descriptionEn}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground">
          Especificações
        </p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="clientName">
              Dono de Obra
            </label>
            <input
              id="clientName"
              name="clientName"
              defaultValue={project?.clientName}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="year">
              Ano
            </label>
            <input id="year" name="year" defaultValue={project?.year} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="area">
              Área
            </label>
            <input
              id="area"
              name="area"
              defaultValue={project?.area}
              placeholder="ex: 1200 m²"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="budgetEstimate">
              Estimativa de Custo de Empreitada
            </label>
            <input
              id="budgetEstimate"
              name="budgetEstimate"
              defaultValue={project?.budgetEstimate}
              placeholder="ex: 1 200 000 €"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {project && order.length > 0 ? (
        <div className="sm:col-span-2">
          <label className={labelClass}>Imagens atuais</label>
          {order.map((image) => (
            <input key={image} type="hidden" name="imageOrder" value={image} />
          ))}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {order.map((image, index) => {
              const marked = imagesToRemove.has(image);
              return (
                <div
                  key={image}
                  draggable
                  onDragStart={(e) => {
                    setDragging(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging !== null) moveImage(dragging, index);
                    setDragging(null);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={`group relative block cursor-grab active:cursor-grabbing ${dragging === index ? "opacity-40" : ""}`}
                >
                  <div
                    className={`relative aspect-[4/3] overflow-hidden bg-secondary ${marked ? "opacity-30" : ""}`}
                  >
                    <Image src={image} alt="" fill sizes="200px" className="pointer-events-none object-cover" />
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      {index === 0 ? "1 · capa" : index + 1}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    name="removeImage"
                    value={image}
                    checked={marked}
                    aria-label={`Remover imagem ${index + 1}`}
                    className="absolute right-2 top-2 h-4 w-4 cursor-pointer"
                    onChange={(e) => {
                      setImagesToRemove((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(image);
                        else next.delete(image);
                        return next;
                      });
                    }}
                  />
                  <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0}
                      aria-label="Mover para a esquerda"
                      className="px-1 hover:text-foreground disabled:opacity-30"
                    >
                      ←
                    </button>
                    <span className="tracking-widest">{marked ? "remover" : ""}</span>
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === order.length - 1}
                      aria-label="Mover para a direita"
                      className="px-1 hover:text-foreground disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Arraste as imagens (ou use ← →) para mudar a ordem; a primeira é a capa. Marque a caixa
            para remover uma imagem. As alterações ficam gravadas ao guardar.
          </p>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="images">
          {project ? "Adicionar imagens" : "Imagens"}
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="block text-sm text-foreground file:mr-4 file:rounded-full file:border file:border-border file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-xs file:tracking-widest file:text-foreground"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="featuredPhotoCount">
          Fotos a mostrar na página inicial (se em destaque)
        </label>
        <select
          id="featuredPhotoCount"
          name="featuredPhotoCount"
          defaultValue={project?.featuredPhotoCount ?? 1}
          className={inputClass}
        >
          {[1, 2, 3].map((n) => (
            <option key={n} value={n} className="bg-background text-foreground">
              {n}
            </option>
          ))}
        </select>
        {project ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {remainingCount} imagem(ns) ficará(ão) disponível(eis) após guardar.
          </p>
        ) : null}
      </div>

      {error ? <p className="sm:col-span-2 text-sm text-red-400">{error}</p> : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full border border-border px-6 py-3 font-mono text-xs tracking-widest text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
        >
          {uploading ? "A enviar imagens..." : pending ? "A guardar..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
