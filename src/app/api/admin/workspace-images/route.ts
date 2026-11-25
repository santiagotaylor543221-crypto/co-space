import { MAX_IMAGE_BYTES, storePhoto } from "@/lib/workspace-upload";

// /api/admin/* is protected by the ADMIN role check in proxy.ts.
export async function POST(request: Request) {
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
    if (!size) return Response.json({ error: "La foto está vacía." }, { status: 400 });
    const imageUrl = await storePhoto(Buffer.concat(chunks));
    return Response.json({ imageUrl }, { status: 201 });
  } catch (error) {
    if (["EACCES", "ENOSPC", "EROFS"].includes((error as NodeJS.ErrnoException).code || "")) {
      return Response.json({ error: "No se pudo almacenar la imagen. Revisa el almacenamiento del servidor." }, { status: 503 });
    }
    return Response.json({ error: "No se pudo procesar la foto. Usa un JPG, PNG o WebP válido de hasta 25 megapíxeles." }, { status: 400 });
  } finally { reader.releaseLock(); }
}
