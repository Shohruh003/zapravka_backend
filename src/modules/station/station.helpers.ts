import { GasCategory } from "../../models/GasCategory";
import { IStationGasCategory, IBusinessHour } from "../../models/Station";

/** Default 7-day business hours (08:00–23:00, all open). */
export function defaultBusinessHours(): IBusinessHour[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startTimeHour: "08",
    startTimeMinute: "00",
    endTimeHour: "23",
    endTimeMinute: "00",
    isAvailable: true,
  }));
}

/**
 * Given station types (e.g. ["benzine","gas"]) builds the embedded fuel list,
 * prefilling prices from each GasCategory's defaultPrice so the client detail
 * view immediately has meaningful data.
 */
export async function buildGasCategoriesForTypes(
  types: string[]
): Promise<IStationGasCategory[]> {
  if (!types?.length) return [];
  const cats = await GasCategory.find({ kind: { $in: types } });
  return cats.map((c) => ({
    gasCategoryId: c._id,
    price: c.defaultPrice || 0,
    available: 50,
  }));
}

/** Parses the multipart `type` field which arrives as a JSON string or array. */
export function parseTypes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}
