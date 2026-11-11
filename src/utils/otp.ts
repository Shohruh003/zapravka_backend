import { env } from "../config/env";

/**
 * Generates a 4-digit OTP. In dev mode, if OTP_DEV_FIXED is set we always
 * return that value so testing is painless (default "0000").
 */
export function generateOtp(): string {
  if (env.otp.mode === "dev" && env.otp.devFixed) {
    return env.otp.devFixed;
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function otpExpiry(): Date {
  return new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000);
}

/**
 * "Sends" the OTP. In dev we just log it (and the caller also returns it in
 * the response). Real SMS providers (Eskiz / Play Mobile) can be wired here.
 */
export async function sendOtp(phoneNumber: string, otp: string): Promise<void> {
  if (env.otp.mode === "dev") {
    console.log(`📲 [DEV OTP] ${phoneNumber} -> ${otp}`);
    return;
  }
  // TODO: integrate Eskiz.uz / Play Mobile here when real SMS is enabled.
  console.log(`📲 [${env.otp.mode}] (not implemented) ${phoneNumber} -> ${otp}`);
}
