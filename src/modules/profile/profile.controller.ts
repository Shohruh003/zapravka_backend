import { Request, Response } from "express";
import { User } from "../../models/User";
import { sendOk, ApiError } from "../../utils/response";

/** POST /api/v1/profile/updateProfile
 *  data: { token, userId, firstName, lastName, oldPassword?, newPassword? } */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, oldPassword, newPassword } = req.payload;

  const user = await User.findById(req.auth!.id);
  if (!user) throw new ApiError("Foydalanuvchi topilmadi", 404);

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;

  if (newPassword) {
    const ok = oldPassword && (await user.comparePassword(oldPassword));
    if (!ok) throw new ApiError("Eski parol noto'g'ri", 400);
    user.password = newPassword; // re-hashed by pre-save hook
  }

  await user.save();

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  sendOk(req, res, {
    id: user._id.toString(),
    phoneNumber: user.phoneNumber,
    name,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}
