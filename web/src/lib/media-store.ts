import { getCloudflareContext } from "@opennextjs/cloudflare";

type MediaKV = {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer,
    options?: { metadata?: { contentType: string } },
  ): Promise<void>;
  getWithMetadata(
    key: string,
    options: { type: "stream"; cacheTtl?: number },
  ): Promise<{ value: ReadableStream | null; metadata: { contentType?: string } | null }>;
};

/** The Workers KV namespace holding admin uploads (wrangler.jsonc). */
export async function getMediaKV(): Promise<MediaKV> {
  const { env } = await getCloudflareContext({ async: true });
  const kv = (env as { IMAGES_KV?: MediaKV }).IMAGES_KV;
  if (!kv) throw new Error("IMAGES_KV binding is not configured.");
  return kv;
}
