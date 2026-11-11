import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ApiError, sendErr } from "../utils/response";

export function notFound(req: Request, res: Response): void {
  sendErr(req, res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Intentional application errors — safe to surface verbatim.
  if (err instanceof ApiError) {
    sendErr(req, res, err.message, err.status);
    return;
  }

  // File upload errors -> 4xx, not 500.
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Fayl hajmi juda katta (maks 8MB)" : "Fayl yuklashda xatolik";
    sendErr(req, res, msg, status);
    return;
  }
  if (err instanceof Error && err.message === "Only image files are allowed") {
    sendErr(req, res, "Faqat rasm fayllari ruxsat etilgan", 400);
    return;
  }

  const e = err as any;

  // Bad ObjectId / validation -> 400, not 500.
  if (e?.name === "CastError") {
    sendErr(req, res, "Noto'g'ri identifikator formati", 400);
    return;
  }
  if (e?.name === "ValidationError") {
    sendErr(req, res, "Ma'lumotlar validatsiyadan o'tmadi", 400);
    return;
  }
  // Mongo duplicate key.
  if (e?.code === 11000) {
    sendErr(req, res, "Bu yozuv allaqachon mavjud", 409);
    return;
  }

  // Unexpected: log full detail server-side, return a generic message to the client.
  console.error("💥 Unhandled error:", err);
  sendErr(req, res, "Serverda kutilmagan xatolik yuz berdi", 500);
}
