import { mkdir } from "node:fs";
import { access, constants, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { env, hasR2Config } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import {
  basenameKey,
  getR2ObjectStream,
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
  limits: { fileSize: 500 * 1024 * 1024 },
});

function fileViewPath(assetId: string) {
  return `${env.API_PREFIX}/files/${assetId}/view`;
}

export async function saveUploadedFile(
  file: Express.Multer.File,
  uploadedBy: string,
) {
  if (!file) throw new AppError(400, "NO_FILE", "No file uploaded");

  const processed = await processImageIfNeeded(file.path, file.mimetype);
  const filename = path.basename(processed.path);
  const relativePath = path.join(env.UPLOAD_DIR, filename).replace(/\\/g, "/");
  const isImage = processed.mimeType.startsWith("image/");

  let storageKind: "local" | "r2" = "local";
  let url = `/${relativePath}`;
  let storagePath = relativePath;

  if (hasR2Config()) {
    try {
      const buffer = processed.buffer ?? (await readFile(processed.path));
      const key = basenameKey(filename, isImage ? "avatars" : "uploads");
      const uploaded = await uploadToR2({
        key,
        body: buffer,
        contentType: processed.mimeType,
      });
      storageKind = "r2";
      storagePath = uploaded.key;
      // Prefer CDN public URL; otherwise a stable API view path (signed redirect).
      url = uploaded.url || "";
      await unlink(processed.path).catch(() => undefined);
    } catch (err) {
      throw new AppError(
        502,
        "R2_UPLOAD_FAILED",
        err instanceof Error ? err.message : "Failed to upload file to R2",
      );
    }
  }

  const asset = await FileAsset.create({
    originalName: file.originalname,
    mimeType: processed.mimeType,
    size: processed.size,
    storage: storageKind,
    path: storagePath,
    url: url || undefined,
    uploadedBy,
  });

  if (!asset.url) {
    asset.url = fileViewPath(String(asset._id));
    await asset.save();
  }

  return {
    id: String(asset._id),
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    size: asset.size,
    storage: asset.storage,
    path: asset.path,
    url: asset.url,
  };
}

export async function getDownloadInfo(assetId: string, userId: string) {
  const asset = await FileAsset.findById(assetId);
  if (!asset) throw new AppError(404, "NOT_FOUND", "File not found");

  if (asset.storage === "r2") {
    const signed = await getR2SignedUrl(asset.path);
    const publicUrl =
      env.R2_PUBLIC_URL && asset.path
        ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${asset.path}`
        : null;

    // Prefer proxying through the API so authenticated browser downloads
    // work without R2 CORS. Public CDN URL is still exposed for signed-url.
    const r2Stream = await getR2ObjectStream(asset.path);
    if (!r2Stream) {
      throw new AppError(404, "FILE_MISSING", "File missing in storage");
    }

    return {
      asset,
      signedUrl: publicUrl ?? signed ?? asset.url,
      stream: () => r2Stream,
      absolutePath: null as null,
      // Only redirect when client explicitly wants the CDN/signed link.
      redirectUrl: null as null,
      publicUrl,
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
    publicUrl: null as null,
  };
}

export async function getPublicViewInfo(assetId: string) {
  const asset = await FileAsset.findById(assetId);
  if (!asset) throw new AppError(404, "NOT_FOUND", "File not found");
  const mime = asset.mimeType ?? "";
  const allowed =
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/");
  if (!allowed) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only images, videos, and audio can be viewed this way",
    );
  }
  return getDownloadInfo(assetId, "public");
}
