import "../types/envelope";
import { connectDB, disconnectDB } from "../config/db";
import { ensureSuperAdmin } from "../bootstrap/ensureSuperAdmin";
import { GasCategory } from "../models/GasCategory";
import { User } from "../models/User";
import { Station } from "../models/Station";
import { buildGasCategoriesForTypes, defaultBusinessHours } from "../modules/station/station.helpers";

const GAS_CATEGORIES = [
  { name_uz: "AI-80", name_ru: "АИ-80", kind: "benzine", defaultPrice: 7000 },
  { name_uz: "AI-92", name_ru: "АИ-92", kind: "benzine", defaultPrice: 8600 },
  { name_uz: "AI-95", name_ru: "АИ-95", kind: "benzine", defaultPrice: 9800 },
  { name_uz: "AI-98", name_ru: "АИ-98", kind: "benzine", defaultPrice: 11000 },
  { name_uz: "AI-100", name_ru: "АИ-100", kind: "benzine", defaultPrice: 12000 },
  { name_uz: "Propan", name_ru: "Пропан", kind: "gas", defaultPrice: 5200 },
  { name_uz: "Metan", name_ru: "Метан", kind: "gas", defaultPrice: 4500 },
  { name_uz: "Dizel", name_ru: "Дизель", kind: "diesel", defaultPrice: 9000 },
  { name_uz: "Elektr", name_ru: "Электро", kind: "electric", defaultPrice: 1500 },
];

const STATION_ADMINS = [
  { phoneNumber: "998901110011", password: "admin123", firstName: "Jasur", lastName: "Karimov" },
  { phoneNumber: "998901110022", password: "admin123", firstName: "Dilshod", lastName: "Rahimov" },
];

// [name, address, type[], lat, lng]
const SAMPLE_STATIONS: Array<{
  name: string;
  address: string;
  type: string[];
  lat: number;
  lng: number;
  phoneNumber: string;
}> = [
  { name: "Lukoil №14", address: "Toshkent, Mirzo Ulug'bek t., Buyuk Ipak Yo'li", type: ["benzine"], lat: 41.311158, lng: 69.279737, phoneNumber: "998901234567" },
  { name: "UzGazOil", address: "Toshkent, Yunusobod t., Amir Temur ko'chasi", type: ["benzine", "diesel"], lat: 41.327089, lng: 69.281698, phoneNumber: "998901234568" },
  { name: "UNG Chilonzor", address: "Toshkent, Chilonzor t., Muqimiy ko'chasi", type: ["gas"], lat: 41.304174, lng: 69.222311, phoneNumber: "998901234569" },
  { name: "Metan Shoxobcha №2", address: "Toshkent, Shayxontohur t., Navoiy ko'chasi", type: ["gas"], lat: 41.291394, lng: 69.256142, phoneNumber: "998901234570" },
  { name: "EV Charge Sergeli", address: "Toshkent, Sergeli t., Yangi Sergeli yo'li", type: ["electric"], lat: 41.3, lng: 69.25, phoneNumber: "998901234571" },
  { name: "Universal AZS", address: "Toshkent, Yakkasaroy t., Bobur ko'chasi", type: ["benzine", "gas", "diesel"], lat: 41.32, lng: 69.27, phoneNumber: "998901234572" },
];

async function seed(): Promise<void> {
  await connectDB();
  await ensureSuperAdmin();

  // 1) Gas categories (upsert by name_ru)
  for (const gc of GAS_CATEGORIES) {
    await GasCategory.updateOne({ name_ru: gc.name_ru }, { $set: gc }, { upsert: true });
  }
  console.log(`⛽ Gas categories: ${await GasCategory.countDocuments()}`);

  // 2) Station admins (upsert by phone)
  const adminIds: string[] = [];
  for (const a of STATION_ADMINS) {
    let admin = await User.findOne({ phoneNumber: a.phoneNumber });
    if (!admin) {
      admin = await User.create({ ...a, role: "stationAdmin", isVerified: true });
    }
    adminIds.push(admin._id.toString());
  }
  console.log(`👥 Station admins: ${adminIds.length}`);

  // 3) Sample stations (reset + recreate)
  await Station.deleteMany({});
  let i = 0;
  for (const s of SAMPLE_STATIONS) {
    const gasCategories = await buildGasCategoriesForTypes(s.type);
    await Station.create({
      name: s.name,
      address: s.address,
      phoneNumber: s.phoneNumber,
      latitude: s.lat,
      longitude: s.lng,
      userId: adminIds[i % adminIds.length],
      type: s.type,
      filePath: "",
      gasCategories,
      businessHours: defaultBusinessHours(),
      location: { type: "Point", coordinates: [s.lng, s.lat] },
    });
    i++;
  }
  console.log(`🏪 Stations: ${await Station.countDocuments()}`);

  console.log("✅ Seed complete");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
