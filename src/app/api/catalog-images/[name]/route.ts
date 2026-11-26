import { getImageUrl, imageExists } from "@/lib/s3-storage";

const allowedImages = new Set([
  "sala-duo.webp",
  "sala-reuniones-creativa.webp",
  "gaming-room.webp",
  "cabina-privada-llamadas.webp",
  "escritorio-flex-zona-a.webp",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  if (!allowedImages.has(name)) {
    return new Response(null, { status: 404 });
  }

  try {
    const key = `originals/catalog/${name}`;

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
    console.error("Catalog image retrieval failed:", error);

    return new Response(null, { status: 503 });
  }
}