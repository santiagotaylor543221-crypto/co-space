import { isImageId, readPhoto } from "@/lib/workspace-upload";
import { getImageUrl, imageExists } from "@/lib/s3-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isImageId(id)) {
    return new Response(null, { status: 404 });
  }

  try {
    const photo = await readPhoto(id);

    if (photo) {
      return new Response(new Uint8Array(photo), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const key = `originals/spaces/${id}`;

    if (!(await imageExists(key))) {
      return new Response(null, { status: 404 });
    }

    const signedUrl = await getImageUrl(key);

    return new Response(null, {
      status: 307,
      headers: {
        Location: signedUrl,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Workspace image retrieval failed:", error);

    return new Response(null, { status: 503 });
  }
}