import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  return bucket;
}

export async function uploadImage(key: string, bytes: Buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: bytes,
      ContentType: "image/webp",
    }),
  );

  return key;
}

export async function readImage(key: string, signal: AbortSignal) {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 900 });
  // La firma autoriza solo este GET y permanece en el servidor.
  const result = await fetch(url, { cache: "no-store", redirect: "error", signal });

  if (result.status === 200 && result.body) return result.body;
  if (result.status === 404) {
    // S3 también devuelve 404 cuando el bucket no existe.
    if (/<Code>\s*NoSuchKey\s*<\/Code>/.test(await result.text())) return null;
  } else {
    await result.body?.cancel();
  }
  throw new Error("Object storage returned an unexpected response");
}

export async function deleteImage(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}
