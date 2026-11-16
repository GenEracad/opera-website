/** Admin uploads live in Workers KV (binding IMAGES_KV) and are served by the
 * site itself at /media/<key> (src/app/media/[...key]/route.ts). */
export const MEDIA_PATH = "/media";

/** Largest image the admin accepts — Workers KV caps a value at 25 MiB.
 * Keep the browser check and the upload route in step. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
