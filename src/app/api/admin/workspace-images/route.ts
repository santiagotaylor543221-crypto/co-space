import { protectApi } from '@/lib/auth/api';
import { InvalidImageError, MAX_IMAGE_BYTES, storePhoto } from "@/lib/workspace-upload";

export const POST = protectApi('ADMIN', async (_user, request: Request) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(request.headers.get("content-type") || "")) {
    return Response.json({ error: "Usa una foto JPG, PNG o WebP." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES) {
    return Response.json({ error: "La foto no puede superar 5 MB." }, { status: 413 });
  }
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Selecciona una foto." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return Response.json({ error: "La foto no puede superar 5 MB." }, { status: 413 });
      }
      chunks.push(value);
    }
  } catch {
    return Response.json({ error: "No se pudo leer la foto." }, { status: 400 });
  } finally {
    reader.releaseLock();
  }

  if (!size) return Response.json({ error: "La foto está vacía." }, { status: 400 });
  try {
    const imageUrl = await storePhoto(Buffer.concat(chunks));
    return Response.json({ imageUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return Response.json({ error: "No se pudo procesar la foto. Usa un JPG, PNG o WebP válido de hasta 25 megapíxeles." }, { status: 400 });
    }
    console.error("Could not store a workspace image");
    return Response.json({ error: "No se pudo almacenar la imagen. Intenta de nuevo más tarde." }, { status: 503 });
  }
});
