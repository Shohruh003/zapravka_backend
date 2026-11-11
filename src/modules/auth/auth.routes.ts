import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired } from "../../middleware/auth";
import { register, verifyOtp, login, me } from "./auth.controller";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/verifyOtp", asyncHandler(verifyOtp));
router.post("/login", asyncHandler(login));
router.post("/me", authRequired, asyncHandler(me));

export default router;
