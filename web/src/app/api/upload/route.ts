import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { MAX_UPLOAD_BYTES, MEDIA_BASE_URL } from "@/lib/media";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

type Bucket = {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
};

/**
 * Stores one image from the admin in the R2 bucket (binding IMAGES_BUCKET)
 * and returns its public URL on media.operastudio.net.
 *
 * The browser PUTs the file body here (src/lib/browser-upload.ts); the Worker
 * hands it to R2 through the binding, so no outbound request or extra keys
 * are involved.
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const username = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!username) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only images can be uploaded." }, { status: 415 });
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image too large." }, { status: 413 });
  }
  if (!request.body) return NextResponse.json({ error: "Empty upload." }, { status: 400 });

  const ext =
    (new URL(request.url).searchParams.get("ext") ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) ||
    "jpg";
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as { IMAGES_BUCKET?: Bucket }).IMAGES_BUCKET;
  if (!bucket) return NextResponse.json({ error: "Image storage is not configured." }, { status: 500 });

  // R2 needs a known length to stream; without one, buffer the (≤30MB) body.
  const body = length > 0 ? request.body : await request.arrayBuffer();
  await bucket.put(key, body, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
  return NextResponse.json({ url: `${MEDIA_BASE_URL}/${key}` });
}
