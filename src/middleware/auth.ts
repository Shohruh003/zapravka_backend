import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../utils/jwt";
import { sendErr } from "../utils/response";
import { UserRole } from "../models/User";

function extractToken(req: Request): string | undefined {
  // 1) token inside the envelope data (how the frontends send it)
  const fromPayload = req.payload?.token;
  if (fromPayload && typeof fromPayload === "string") return fromPayload;

  // 2) Authorization: Bearer <token> (car update uses this)
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  // 3) flat body token (multipart)
  if (req.body?.token && typeof req.body.token === "string") return req.body.token;

  return undefined;
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    sendErr(req, res, "Unauthorized: token required", 401);
    return;
  }
  try {
    const claims = verifyAccess(token);
    req.auth = {
      id: claims.sub,
      phoneNumber: claims.phoneNumber,
      role: claims.role,
    };
    next();
  } catch {
    sendErr(req, res, "Unauthorized: invalid or expired token", 401);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      sendErr(req, res, "Forbidden: insufficient permissions", 403);
      return;
    }
    next();
  };
}
