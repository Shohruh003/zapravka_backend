import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired, requireRole } from "../../middleware/auth";
import {
  createStationAdmin,
  getAllStationAdmins,
  updateStationAdmin,
  deleteStationAdmin,
} from "./stationAdmin.controller";

const router = Router();

router.post("/create", authRequired, requireRole("superAdmin"), asyncHandler(createStationAdmin));
router.post("/getAll", authRequired, requireRole("superAdmin"), asyncHandler(getAllStationAdmins));
router.post("/update", authRequired, requireRole("superAdmin"), asyncHandler(updateStationAdmin));
router.post("/delete", authRequired, requireRole("superAdmin"), asyncHandler(deleteStationAdmin));

export default router;
