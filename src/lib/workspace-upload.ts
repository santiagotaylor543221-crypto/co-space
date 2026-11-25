import path from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const imageDirectory = () => path.resolve(process.env.WORKSPACE_UPLOAD_DIR || "./data/workspace-images");
export const isImageId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(id);

export async function normalizePhoto(bytes: Buffer) {
  const image = sharp(bytes, { limitInputPixels: 25_000_000, animated: false });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) throw new Error("Formato de imagen no admitido");
  return image.rotate().resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
}

export async function storePhoto(bytes: Buffer) {
  const photo = await normalizePhoto(bytes);
  await mkdir(imageDirectory(), { recursive: true });
  const id = randomUUID() + ".webp";
  await writeFile(path.join(imageDirectory(), id), photo, { flag: "wx" });
  return "/api/workspace-images/" + id;
}
export async function readPhoto(id: string) {
  if (!isImageId(id)) return null;
  try { return await readFile(path.join(imageDirectory(), id)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
