const BLOB_API_URL = "https://vercel.com/api/blob";
const BLOB_API_VERSION = "12";

/**
 * Uploads a public file to Vercel Blob using the runtime's own fetch.
 *
 * @vercel/blob's put() sends requests through undici, which compiles
 * WebAssembly on first use — Cloudflare Workers forbid that, so put() hangs
 * forever there. This mirrors put() from @vercel/blob 2.8 (same endpoint and
 * headers) for the simple single-request case the admin needs.
 */
export async function putPublicBlob(
  pathname: string,
  body: ArrayBuffer,
  contentType?: string,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  // Token format: vercel_blob_rw_<storeId>_<secret>
  const storeId = token.split("_")[3] ?? "";

  const res = await fetch(`${BLOB_API_URL}/?${new URLSearchParams({ pathname })}`, {
    method: "PUT",
    body,
    headers: {
      authorization: `Bearer ${token}`,
      "x-api-version": BLOB_API_VERSION,
      "x-vercel-blob-store-id": storeId,
      "x-vercel-blob-access": "public",
      ...(contentType ? { "x-content-type": contentType } : {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Vercel Blob upload failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
