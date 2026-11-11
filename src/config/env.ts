import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? "5000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  baseUrl: (process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? "5000"}`).replace(/\/$/, ""),

  mongoUri: required("MONGODB_URI", "mongodb://localhost:27017/zapravka"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "7d",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "30d",
  },

  otp: {
    mode: (process.env.OTP_MODE ?? "dev").toLowerCase(),
    ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES ?? "5", 10),
    devFixed: process.env.OTP_DEV_FIXED ?? "", // if set, dev OTP always equals this
  },

  corsOrigins: (process.env.CORS_ORIGINS ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  superAdmin: {
    phone: (process.env.SUPER_ADMIN_PHONE ?? "998901112233").replace(/^\+/, ""),
    password: process.env.SUPER_ADMIN_PASSWORD ?? "admin123",
    firstName: process.env.SUPER_ADMIN_FIRSTNAME ?? "Super",
    lastName: process.env.SUPER_ADMIN_LASTNAME ?? "Admin",
  },
};

export const isDev = env.nodeEnv !== "production";

/**
 * In production, refuse to boot with guessable default secrets/credentials.
 * (In dev the fallbacks above keep setup frictionless.)
 */
export function assertProductionSecrets(): void {
  if (isDev) return;
  const missing: string[] = [];
  if (!process.env.JWT_ACCESS_SECRET) missing.push("JWT_ACCESS_SECRET");
  if (!process.env.JWT_REFRESH_SECRET) missing.push("JWT_REFRESH_SECRET");
  if (!process.env.SUPER_ADMIN_PASSWORD) missing.push("SUPER_ADMIN_PASSWORD");
  if (missing.length) {
    throw new Error(
      `Refusing to start in production without: ${missing.join(", ")}. Set these in the environment.`
    );
  }
}
