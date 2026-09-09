import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env, hasR2Config } from "../config/env.js";
import { logger } from "./logger.js";

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!hasR2Config()) return null;
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint:
        env.R2_ENDPOINT ||
        `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return r2Client;
}

export async function processImageIfNeeded(
  absolutePath: string,
  mimeType: string,
): Promise<{ path: string; mimeType: string; size: number; buffer?: Buffer }> {
  if (!mimeType.startsWith("image/") || mimeType.includes("svg")) {
    const buffer = await readFile(absolutePath);
    return { path: absolutePath, mimeType, size: buffer.length, buffer };
  }

  const outPath = absolutePath.replace(/(\.[^.]+)?$/, ".webp");
  const buffer = await sharp(absolutePath)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  await sharp(buffer).toFile(outPath);
  if (outPath !== absolutePath) {
    await unlink(absolutePath).catch(() => undefined);
  }
  return { path: outPath, mimeType: "image/webp", size: buffer.length, buffer };
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  if (!client || !env.R2_BUCKET) {
    throw new Error("R2 is not configured");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  // Prefer custom public CDN / r2.dev pub URL. Without it, callers should
  // expose a signed or proxied view URL (bucket-name.r2.dev is not public).
  const url = env.R2_PUBLIC_URL
    ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${params.key}`
    : "";

  logger.info("Uploaded to R2", { key: params.key, public: Boolean(url) });
  return { key: params.key, url };
}

export async function getR2SignedUrl(key: string, expiresIn = 3600) {
  const client = getR2Client();
  if (!client || !env.R2_BUCKET) return null;
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
    { expiresIn },
  );
}

/** Readable stream of an R2 object for authenticated API proxy downloads. */
export async function getR2ObjectStream(key: string) {
  const client = getR2Client();
  if (!client || !env.R2_BUCKET) return null;
  const result = await client.send(
    new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
  );
  const body = result.Body;
  if (!body) return null;
  // AWS SDK v3 Body is a web/Node readable stream.
  return body as NodeJS.ReadableStream;
}

export function localReadStream(absolutePath: string) {
  return createReadStream(absolutePath);
}

export function basenameKey(filename: string, folder = "uploads") {
  return `${folder.replace(/\/$/, "")}/${path.basename(filename)}`;
}
