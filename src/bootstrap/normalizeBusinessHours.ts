import { Station } from "../models/Station";

/**
 * Idempotent data fix. Early builds stored Sunday as dayOfWeek 0 (JS getDay()),
 * but the client renders ISO weekdays 1=Monday … 7=Sunday — a 0 showed up as
 * "noma'lum". Rewrites any 0 to 7 on boot; a no-op once data is clean.
 */
export async function normalizeBusinessHours(): Promise<void> {
  const res = await Station.updateMany(
    { "businessHours.dayOfWeek": 0 },
    { $set: { "businessHours.$[h].dayOfWeek": 7 } },
    { arrayFilters: [{ "h.dayOfWeek": 0 }] }
  );
  if (res.modifiedCount) {
    console.log(`🗓️  Normalized business hours (Sunday 0 -> 7) on ${res.modifiedCount} station(s)`);
  }
}
