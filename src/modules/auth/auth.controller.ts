import { Request, Response } from "express";
import { User } from "../../models/User";
import { signTokens } from "../../utils/jwt";
import { generateOtp, otpExpiry, sendOtp } from "../../utils/otp";
import { sendOk, ApiError } from "../../utils/response";
import { normalizePhone } from "../../utils/phone";
import { env } from "../../config/env";

const isDevOtp = env.otp.mode === "dev";

/** POST /api/v1/auth/register  — data: { password, phoneNumber, firstName, lastName } */
export async function register(req: Request, res: Response): Promise<void> {
  const { password, firstName, lastName } = req.payload;
  const phoneNumber = normalizePhone(req.payload.phoneNumber);

  if (!phoneNumber || !password) {
    throw new ApiError("phoneNumber and password are required", 400);
  }

  const otp = generateOtp();
  const existing = await User.findOne({ phoneNumber });

  if (existing && existing.isVerified) {
    throw new ApiError("Bu telefon raqami allaqachon ro'yxatdan o'tgan", 409);
  }

  if (existing) {
    // not verified yet -> refresh password + otp, resend
    existing.password = password; // re-hashed by pre-save hook
    existing.firstName = firstName ?? existing.firstName;
    existing.lastName = lastName ?? existing.lastName;
    existing.otp = otp;
    existing.otpExpiresAt = otpExpiry();
    existing.otpAttempts = 0;
    await existing.save();
  } else {
    await User.create({
      phoneNumber,
      password,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      role: "user",
      isVerified: false,
      otp,
      otpExpiresAt: otpExpiry(),
      otpAttempts: 0,
    });
  }

  await sendOtp(phoneNumber, otp);

  // IRegisterResponse.data = { phoneNumber, otp }. In dev we echo the OTP so it can be used immediately.
  sendOk(req, res, { phoneNumber, otp: isDevOtp ? otp : "" });
}

/** POST /api/v1/auth/verifyOtp  — data: { phoneNumber, otp } */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const phoneNumber = normalizePhone(req.payload.phoneNumber);
  const otp = (req.payload.otp ?? "").toString();

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new ApiError("Foydalanuvchi topilmadi", 404);

  const notExpired = !!user.otpExpiresAt && user.otpExpiresAt.getTime() > Date.now();
  const valid = !!user.otp && user.otp === otp && notExpired;

  if (!valid) {
    // brute-force guard: after 5 wrong tries, burn the OTP so a new one must be requested
    user.otpAttempts = (user.otpAttempts ?? 0) + 1;
    if (user.otpAttempts >= 5) {
      user.otp = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save();
      throw new ApiError("Juda ko'p noto'g'ri urinish. Yangi kod so'rang", 429);
    }
    await user.save();
    throw new ApiError("SMS kod noto'g'ri yoki muddati o'tgan", 400);
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();

  const tokens = signTokens({
    id: user._id.toString(),
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });

  sendOk(req, res, tokens);
}

/** POST /api/v1/auth/login  — data: { phoneNumber, password } */
export async function login(req: Request, res: Response): Promise<void> {
  const phoneNumber = normalizePhone(req.payload.phoneNumber);
  const password = (req.payload.password ?? "").toString();

  const user = await User.findOne({ phoneNumber });
  if (!user) throw new ApiError("Telefon raqami yoki parol xato", 401);

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError("Telefon raqami yoki parol xato", 401);

  if (user.role === "user" && !user.isVerified) {
    throw new ApiError("Hisob tasdiqlanmagan. Avval SMS kodni tasdiqlang", 403);
  }

  const tokens = signTokens({
    id: user._id.toString(),
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });

  sendOk(req, res, tokens);
}

/** POST /api/v1/auth/me  — data: { token }  (auth middleware already validated it) */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth!.id);
  if (!user) throw new ApiError("Foydalanuvchi topilmadi", 404);

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  sendOk(req, res, {
    id: user._id.toString(),
    phoneNumber: user.phoneNumber,
    name,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}
