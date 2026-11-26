import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

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

export async function getImageUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 900,
  });
}

export async function deleteImage(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

export async function imageExists(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );

    return true;
  } catch (error) {
    const awsError = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };

    if (awsError.$metadata?.httpStatusCode === 404) {
      return false;
    }

    throw error;
  }
}