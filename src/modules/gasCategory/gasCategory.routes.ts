import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired } from "../../middleware/auth";
import { getGasCategories } from "./gasCategory.controller";

const router = Router();

router.post("/getGasCategories", authRequired, asyncHandler(getGasCategories));

export default router;
