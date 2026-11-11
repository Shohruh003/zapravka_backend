import { Request, Response } from "express";

/**
 * Builds the standard success envelope the frontends expect:
 *   { status: "ok", serviceName, clientId, userId, requestId, data }
 */
export function sendOk(req: Request, res: Response, data: unknown, httpStatus = 200): Response {
  const meta = req.meta ?? {
    serviceName: "zapravka",
    clientId: "server",
    userId: "",
    requestId: "",
  };
  return res.status(httpStatus).json({
    status: "ok",
    serviceName: meta.serviceName,
    clientId: meta.clientId,
    userId: meta.userId,
    requestId: meta.requestId,
    data,
  });
}

/**
 * Error envelope. Frontends check `status !== "ok"` and sometimes read `error`.
 */
export function sendErr(req: Request, res: Response, message: string, httpStatus = 400): Response {
  const meta = req.meta ?? {
    serviceName: "zapravka",
    clientId: "server",
    userId: "",
    requestId: "",
  };
  return res.status(httpStatus).json({
    status: "error",
    serviceName: meta.serviceName,
    clientId: meta.clientId,
    userId: meta.userId,
    requestId: meta.requestId,
    error: message,
    data: null,
  });
}

/** Throwable application error carrying an HTTP status. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
