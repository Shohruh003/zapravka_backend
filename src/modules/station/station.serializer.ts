import { env } from "../../config/env";

/** Builds an absolute URL for a stored file (or passes through an already-absolute URL). */
export function fileUrl(filePath?: string): string {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${env.baseUrl}/api/v1/files/${filePath}`;
}

/**
 * Serializes a station into a shape that satisfies BOTH frontends:
 *  - admin expects: id, name, address, latitude, longitude, filePath(full URL),
 *    phoneNumber, type[], userId, and a flat `gasCategory[]` with name fields inline.
 *  - client expects: nested `gasCategories[]` ({ gasCategory:{name_uz,name_ru}, ... }),
 *    `businessHours[]`, and `location`.
 * Expects `gasCategories.gasCategoryId` to be populated.
 */
export function serializeStation(station: any): any {
  const s = station?.toObject ? station.toObject() : station;
  const id = (s._id ?? s.id)?.toString();

  const nested = (s.gasCategories ?? []).map((gc: any) => {
    const cat = gc.gasCategoryId && typeof gc.gasCategoryId === "object" ? gc.gasCategoryId : null;
    const gasCategoryId = cat?._id?.toString() ?? gc.gasCategoryId?.toString() ?? "";
    return {
      _id: gc._id?.toString(),
      stationId: id,
      gasCategoryId,
      price: gc.price ?? 0,
      available: gc.available ?? 0,
      createdAt: gc.createdAt,
      updatedAt: gc.updatedAt,
      gasCategory: {
        name_uz: cat?.name_uz ?? "",
        name_ru: cat?.name_ru ?? "",
        kind: cat?.kind ?? "", // "benzine" | "diesel" | "gas" | "electric"
      },
    };
  });

  const flat = nested.map((gc: any) => ({
    id: gc._id,
    gasCategoryId: gc.gasCategoryId,
    price: gc.price,
    available: gc.available,
    name_uz: gc.gasCategory.name_uz,
    name_ru: gc.gasCategory.name_ru,
    kind: gc.gasCategory.kind,
  }));

  // ISO weekdays (1=Mon ... 7=Sun). Legacy documents may still hold Sunday as 0:
  // normalise on read too, so no stale row can surface as an unknown day.
  const isoDay = (d: number) => (d === 0 ? 7 : d);
  const businessHours = [...(s.businessHours ?? [])]
    .sort((a: any, b: any) => isoDay(a.dayOfWeek) - isoDay(b.dayOfWeek))
    .map((bh: any) => ({
    _id: bh._id?.toString(),
    stationId: id,
    dayOfWeek: isoDay(bh.dayOfWeek),
    startTimeHour: bh.startTimeHour,
    startTimeMinute: bh.startTimeMinute,
    endTimeHour: bh.endTimeHour,
    endTimeMinute: bh.endTimeMinute,
    isAvailable: bh.isAvailable,
    createdAt: bh.createdAt,
    updatedAt: bh.updatedAt,
  }));

  return {
    id,
    name: s.name,
    address: s.address ?? "",
    userId: s.userId?.toString() ?? "",
    latitude: s.latitude,
    longitude: s.longitude,
    filePath: fileUrl(s.filePath),
    phoneNumber: s.phoneNumber ?? "",
    type: s.type ?? [],
    gasCategory: flat, // admin (flat)
    gasCategories: nested, // client (nested)
    businessHours,
    location: s.location ?? { type: "Point", coordinates: [s.longitude, s.latitude] },
  };
}
