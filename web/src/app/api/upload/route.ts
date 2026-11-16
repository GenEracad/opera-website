import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { MAX_UPLOAD_BYTES, MEDIA_PATH } from "@/lib/media";
import { getMediaKV } from "@/lib/media-store";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Stores one image from the admin in Workers KV and returns the site path it
 * is served from (/media/uploads/<uuid>.<ext>).
 *
 * The browser PUTs the file body here (src/lib/browser-upload.ts); the Worker
 * writes it through the IMAGES_KV binding, so no outbound request or extra
 * keys are involved.
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const username = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!username) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only images can be uploaded." }, { status: 415 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return NextResponse.json({ error: "Empty upload." }, { status: 400 });
  if (body.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image too large." }, { status: 413 });
  }

  const ext =
    (new URL(request.url).searchParams.get("ext") ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) ||
    "jpg";
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  const kv = await getMediaKV();
  await kv.put(key, body, { metadata: { contentType } });
  return NextResponse.json({ url: `${MEDIA_PATH}/${key}` });
}
