import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired } from "../../middleware/auth";
import { updateProfile } from "./profile.controller";

const router = Router();

router.post("/updateProfile", authRequired, asyncHandler(updateProfile));

export default router;
