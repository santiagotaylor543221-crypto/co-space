import { isImageId, readPhoto } from "@/lib/workspace-upload";
import { imageError, imageResponse, serveStoredImage } from "@/lib/image-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isImageId(id)) return imageError(404);

  try {
    const photo = await readPhoto(id);
    if (photo) {
      return imageResponse(new Uint8Array(photo), "public, max-age=31536000, immutable");
    }
  } catch {
    console.error("Could not read a local workspace image");
    return imageError(503);
  }

  return serveStoredImage(`originals/spaces/${id}`, request.signal);
}
