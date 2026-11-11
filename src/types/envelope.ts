import { UserRole } from "../models/User";

/**
 * Standard request envelope used by every endpoint:
 *   { serviceName, clientId, userId, requestId, data: {...} }
 * For multipart/form-data requests the meta fields + data fields arrive flat
 * in req.body (multer), so `data` may be undefined — controllers read req.body directly then.
 */
export interface RequestMeta {
  serviceName: string;
  clientId: string;
  userId: string;
  requestId: string;
}

export interface AuthInfo {
  id: string;
  phoneNumber: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      meta: RequestMeta;
      /** The inner `data` object of the envelope (object form). */
      payload: Record<string, any>;
      /** Set by auth middleware after a valid token. */
      auth?: AuthInfo;
    }
  }
}

export {};
