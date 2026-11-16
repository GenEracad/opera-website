import { getMediaKV } from "@/lib/media-store";

/**
 * Serves admin uploads stored in Workers KV. Keys are random and never
 * overwritten, so responses are immutable: they are kept in Cloudflare's edge
 * cache (and browsers) for a year, which spares KV reads on repeat visits.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key.startsWith("uploads/") || key.includes("..")) return new Response("Not found", { status: 404 });

  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  const kv = await getMediaKV();
  const { value, metadata } = await kv.getWithMetadata(key, { type: "stream", cacheTtl: 86400 });
  if (!value) return new Response("Not found", { status: 404 });

  const response = new Response(value, {
    headers: {
      "content-type": metadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
  if (cache) await cache.put(cacheKey, response.clone());
  return response;
}
