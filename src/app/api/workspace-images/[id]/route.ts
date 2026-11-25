import { readPhoto } from "@/lib/workspace-upload";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await readPhoto(id);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo), { headers: {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  } });
}
