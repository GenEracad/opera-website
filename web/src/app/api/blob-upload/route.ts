import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Issues short-lived client tokens so admin pages upload images straight from
 * the browser to Vercel Blob (src/lib/browser-upload.ts). The Worker never
 * sends the file itself: @vercel/blob's server-side upload goes through
 * undici, which can't open connections on Cloudflare Workers.
 *
 * Token generation is local HMAC signing, no network call. No
 * onUploadCompleted callback is registered; the form submits the resulting
 * URL to the server action instead.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const cookieStore = await cookies();
        const username = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
        if (!username) throw new Error("Not logged in.");
        if (!pathname.startsWith("uploads/")) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 30 * 1024 * 1024,
          addRandomSuffix: false,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
