"use client";

import { startTransition, useActionState, useState } from "react";

import { MAX_UPLOAD_BYTES } from "@/lib/media";

export type UploadFormState = { error?: string };

const UPLOAD_ERROR = "Não foi possível enviar a imagem. Tente novamente.";
const TOO_LARGE_ERROR = "Cada imagem pode ter no máximo 30 MB.";

/** Uploads one image to the site's R2 storage (/api/upload, admins only)
 * and returns its public URL. */
export async function uploadImage(file: Blob, name = "image"): Promise<string> {
  const ext = (name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const res = await fetch(`/api/upload?ext=${encodeURIComponent(ext)}`, {
    method: "PUT",
    body: file,
    headers: { "content-type": file.type || "image/jpeg" },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text().catch(() => "")}`);
  const { url } = (await res.json()) as { url: string };
  return url;
}

/** Replaces every File in the form data with the URL of the same image,
 * uploaded to R2, so server actions only ever receive URLs. */
async function uploadFilesInFormData(formData: FormData): Promise<void> {
  for (const key of new Set(formData.keys())) {
    const values = formData.getAll(key);
    if (!values.some((v) => v instanceof File)) continue;
    const kept: string[] = [];
    for (const value of values) {
      if (!(value instanceof File)) kept.push(value);
      else if (value.size > 0) kept.push(await uploadImage(value, value.name));
    }
    formData.delete(key);
    for (const value of kept) formData.append(key, value);
  }
}

/** useActionState for admin forms with image inputs: uploads the chosen
 * files from the browser first, then runs the server action with their URLs. */
export function useUploadingAction(
  action: (state: UploadFormState, formData: FormData) => Promise<UploadFormState>,
  initialState: UploadFormState,
) {
  const [state, formAction, pending] = useActionState<UploadFormState, FormData>(action, initialState);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setUploadError(null);
    const tooLarge = [...formData.values()].some((v) => v instanceof File && v.size > MAX_UPLOAD_BYTES);
    if (tooLarge) {
      setUploadError(TOO_LARGE_ERROR);
      return;
    }
    setUploading(true);
    try {
      await uploadFilesInFormData(formData);
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError(UPLOAD_ERROR);
      return;
    } finally {
      setUploading(false);
    }
    startTransition(() => formAction(formData));
  }

  return { state, submit, uploading, pending, error: uploadError ?? state.error };
}
