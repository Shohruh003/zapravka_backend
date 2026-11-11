import { Request, Response } from "express";
import { User } from "../../models/User";
import { sendOk, ApiError } from "../../utils/response";
import { normalizePhone } from "../../utils/phone";
import { escapeRegex } from "../../utils/regex";

function toAdmin(u: any) {
  return {
    id: u._id.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    phoneNumber: u.phoneNumber,
  };
}

/** POST /api/v1/stationAdmin/create
 *  data: { phoneNumber, password, firstName, lastName, token } */
export async function createStationAdmin(req: Request, res: Response): Promise<void> {
  const phoneNumber = normalizePhone(req.payload.phoneNumber);
  const { password, firstName, lastName } = req.payload;

  if (!phoneNumber || !password) throw new ApiError("phoneNumber and password are required", 400);
  if (!firstName || !String(firstName).trim()) throw new ApiError("Ism (firstName) kiritilishi shart", 400);
  if (!/^998\d{9}$/.test(phoneNumber)) {
    throw new ApiError("Telefon raqami noto'g'ri formatda (masalan, 998901234567)", 400);
  }

  const existing = await User.findOne({ phoneNumber });
  if (existing) throw new ApiError("Bu telefon raqami allaqachon mavjud", 409);

  const admin = await User.create({
    phoneNumber,
    password,
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    role: "stationAdmin",
    isVerified: true,
  });

  sendOk(req, res, toAdmin(admin), 201);
}

/** POST /api/v1/stationAdmin/getAll
 *  data: { name, token } -> data: { data: StationAdmin[], count } (note double nesting) */
export async function getAllStationAdmins(req: Request, res: Response): Promise<void> {
  const { name } = req.payload;
  const filter: Record<string, any> = { role: "stationAdmin" };
  if (name) {
    const safe = escapeRegex(name);
    filter.$or = [
      { firstName: { $regex: safe, $options: "i" } },
      { lastName: { $regex: safe, $options: "i" } },
      { phoneNumber: { $regex: safe, $options: "i" } },
    ];
  }

  const admins = await User.find(filter).sort({ createdAt: -1 });
  const data = admins.map(toAdmin);
  sendOk(req, res, { data, count: data.length });
}

/** POST /api/v1/stationAdmin/update  — data: { id, firstName?, lastName?, token } */
export async function updateStationAdmin(req: Request, res: Response): Promise<void> {
  const { id, firstName, lastName } = req.payload;
  if (!id) throw new ApiError("Admin id is required", 400);

  const admin = await User.findOne({ _id: id, role: "stationAdmin" });
  if (!admin) throw new ApiError("Admin topilmadi", 404);

  if (firstName !== undefined) admin.firstName = firstName;
  if (lastName !== undefined) admin.lastName = lastName;
  await admin.save();

  sendOk(req, res, toAdmin(admin));
}

/** POST /api/v1/stationAdmin/delete  — data: { id, token } */
export async function deleteStationAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.payload;
  if (!id) throw new ApiError("Admin id is required", 400);

  const deleted = await User.findOneAndDelete({ _id: id, role: "stationAdmin" });
  if (!deleted) throw new ApiError("Admin topilmadi", 404);

  sendOk(req, res, { id });
}
