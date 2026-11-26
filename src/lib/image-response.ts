import { readImage } from "@/lib/s3-storage";

export function imageResponse(body: BodyInit, cacheControl: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function imageError(status: 404 | 503) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function serveStoredImage(key: string, signal: AbortSignal) {
  try {
    const photo = await readImage(key, AbortSignal.any([signal, AbortSignal.timeout(30_000)]));
    return photo ? imageResponse(photo, "no-store") : imageError(404);
  } catch {
    console.error("Could not read an image from object storage");
    return imageError(503);
  }
}
