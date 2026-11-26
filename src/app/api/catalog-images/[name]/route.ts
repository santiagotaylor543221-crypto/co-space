import { imageError, serveStoredImage } from "@/lib/image-response";

const allowedImages = new Set([
  "sala-duo.webp",
  "sala-reuniones-creativa.webp",
  "gaming-room.webp",
  "cabina-privada-llamadas.webp",
  "escritorio-flex-zona-a.webp",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!allowedImages.has(name)) return imageError(404);

  return serveStoredImage(`originals/catalog/${name}`, request.signal);
}
