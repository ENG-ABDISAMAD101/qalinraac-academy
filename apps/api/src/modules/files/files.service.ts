import { mkdir } from "node:fs";
import { access, constants, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { env, hasR2Config } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import {
  basenameKey,
  getR2SignedUrl,
  localReadStream,
  processImageIfNeeded,
  uploadToR2,
} from "../../lib/storage.js";
import { FileAsset } from "../../models/FileAsset.js";

const mkdirAsync = promisify(mkdir);

export async function ensureUploadDir() {
  const dir = path.resolve(env.UPLOAD_DIR);
  await mkdirAsync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      const dir = await ensureUploadDir();
      cb(null, dir);
    } catch (err) {
      cb(err as Error, env.UPLOAD_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export async function saveUploadedFile(
  file: Express.Multer.File,
  uploadedBy: string,
) {
  if (!file) throw new AppError(400, "NO_FILE", "No file uploaded");

  const processed = await processImageIfNeeded(file.path, file.mimetype);
  const filename = path.basename(processed.path);
  const relativePath = path.join(env.UPLOAD_DIR, filename).replace(/\\/g, "/");

  let storageKind: "local" | "r2" = "local";
  let url = `/${relativePath}`;
  let storagePath = relativePath;

  if (hasR2Config()) {
    const buffer = processed.buffer ?? (await readFile(processed.path));
    const key = basenameKey(filename);
    const uploaded = await uploadToR2({
      key,
      body: buffer,
      contentType: processed.mimeType,
    });
    storageKind = "r2";
    url = uploaded.url;
    storagePath = uploaded.key;
  }

  const asset = await FileAsset.create({
    originalName: file.originalname,
    mimeType: processed.mimeType,
    size: processed.size,
    storage: storageKind,
    path: storagePath,
    url,
    uploadedBy,
  });

  return asset;
}

export async function getDownloadInfo(assetId: string, userId: string) {
  const asset = await FileAsset.findById(assetId);
  if (!asset) throw new AppError(404, "NOT_FOUND", "File not found");

  if (asset.storage === "r2") {
    const signed = await getR2SignedUrl(asset.path);
    return {
      asset,
      signedUrl: signed ?? asset.url,
      stream: null as null,
      absolutePath: null as null,
      redirectUrl: signed ?? asset.url,
    };
  }

  const absolute = path.resolve(asset.path);
  try {
    await access(absolute, constants.R_OK);
  } catch {
    throw new AppError(404, "FILE_MISSING", "File missing on disk");
  }

  const signedUrl = `${env.API_PREFIX}/files/${assetId}/download?u=${userId}&t=${Date.now()}`;

  return {
    asset,
    signedUrl,
    stream: () => localReadStream(absolute),
    absolutePath: absolute,
    redirectUrl: null as null,
  };
}
