import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./files.service.js";

export async function upload(req: Request, res: Response) {
  const file = req.file;
  const data = await service.saveUploadedFile(file as Express.Multer.File, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function signedUrl(req: Request, res: Response) {
  const data = await service.getDownloadInfo(req.params.id, req.user!.id);
  return sendSuccess(res, {
    id: data.asset._id,
    originalName: data.asset.originalName,
    mimeType: data.asset.mimeType,
    size: data.asset.size,
    signedUrl: data.signedUrl,
    url: data.asset.url,
  });
}

export async function download(req: Request, res: Response) {
  const data = await service.getDownloadInfo(req.params.id, req.user?.id ?? "anon");
  if (data.redirectUrl) {
    return res.redirect(data.redirectUrl);
  }
  if (!data.stream) {
    return res.status(404).json({
      success: false,
      error: { code: "FILE_MISSING", message: "No download stream" },
    });
  }
  res.setHeader("Content-Type", data.asset.mimeType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${data.asset.originalName}"`,
  );
  data.stream().pipe(res);
}
