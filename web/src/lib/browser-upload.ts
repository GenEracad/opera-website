"use client";

import { upload } from "@vercel/blob/client";
import { startTransition, useActionState, useState } from "react";

export type UploadFormState = { error?: string };

const UPLOAD_ERROR = "Não foi possível enviar a imagem. Tente novamente.";

/** Uploads one image from the browser straight to Vercel Blob and returns
 * its public URL. The token comes from /api/blob-upload (admins only). */
export async function uploadImage(file: Blob, name = "image"): Promise<string> {
  const ext = (name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const blob = await upload(`uploads/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
    contentType: file.type || undefined,
  });
  return blob.url;
}

/** Replaces every File in the form data with the URL of the same image,
 * uploaded to Blob, so server actions only ever receive URLs. */
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
