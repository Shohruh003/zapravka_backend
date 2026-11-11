import { User } from "../models/User";
import { env } from "../config/env";

/** Idempotently makes sure the super-admin (admin panel login) account exists. */
export async function ensureSuperAdmin(): Promise<void> {
  const { phone, password, firstName, lastName } = env.superAdmin;
  const existing = await User.findOne({ phoneNumber: phone });
  if (existing) {
    if (existing.role !== "superAdmin") {
      existing.role = "superAdmin";
      existing.isVerified = true;
      await existing.save();
    }
    return;
  }
  await User.create({
    phoneNumber: phone,
    password,
    firstName,
    lastName,
    role: "superAdmin",
    isVerified: true,
  });
  // Never log the password. Show it only as a dev hint.
  const hint = process.env.NODE_ENV !== "production" ? " (dev default password: admin123)" : "";
  console.log(`👑 Super-admin created: ${phone}${hint}`);
}
