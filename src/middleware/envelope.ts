import { Request, Response, NextFunction } from "express";

/**
 * Normalizes the incoming request into:
 *   req.meta    -> { serviceName, clientId, userId, requestId }
 *   req.payload -> the inner `data` object (JSON requests) OR the flat body
 *                  (multipart/form-data requests, where multer fills req.body).
 *
 * Safe to run both globally (JSON routes) and again after multer (multipart routes).
 */
export function attachEnvelope(req: Request, _res: Response, next: NextFunction): void {
  const body = (req.body ?? {}) as Record<string, any>;

  req.meta = {
    serviceName: body.serviceName ?? "zapravka",
    clientId: body.clientId ?? "server",
    userId: body.userId ?? "",
    requestId: body.requestId ?? "",
  };

  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    req.payload = body.data;
  } else {
    // multipart or flat body — strip the envelope meta keys so payload is clean-ish
    req.payload = body;
  }

  next();
}
