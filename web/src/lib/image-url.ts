/**
 * Serves images that also ship with the site from the site itself.
 *
 * The images migrated from public/ into Vercel Blob (scripts/migrate-to-db.ts)
 * kept their path — projects/... and team/... — and are still in public/. When
 * a stored URL points at one of those Blob paths, use the local copy, so the
 * site doesn't depend on the Blob store for them (e.g. when it's blocked).
 * Uploads made through the admin (uploads/...) only exist in Blob.
 */
const LOCAL_PREFIXES = ["projects/", "team/"];

export function resolveImageUrl(url: string): string {
  if (!url) return url;
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith(".public.blob.vercel-storage.com")) return url;
    const path = decodeURIComponent(pathname.replace(/^\//, ""));
    return LOCAL_PREFIXES.some((prefix) => path.startsWith(prefix)) ? `/${path}` : url;
  } catch {
    return url; // already a local path such as /brand/opera-logo.svg
  }
}
