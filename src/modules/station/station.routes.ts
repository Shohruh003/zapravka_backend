import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired, requireRole } from "../../middleware/auth";
import { attachEnvelope } from "../../middleware/envelope";
import { upload } from "../../middleware/upload";
import {
  getStations,
  getStationById,
  dashboard,
  createStation,
  updateStation,
  deleteStation,
} from "./station.controller";

const router = Router();

// Read endpoints — any authenticated user (drivers + admins)
router.post("/getStations", authRequired, asyncHandler(getStations));
router.post("/getStationsById", authRequired, asyncHandler(getStationById));
router.post("/dashboard", authRequired, requireRole("superAdmin", "stationAdmin"), asyncHandler(dashboard));

// Write endpoints — superAdmin only (the admin panel logs in as superAdmin and is the
// only UI that creates stations / assigns owners). Multipart: upload -> re-parse envelope -> auth.
router.post(
  "/createStations",
  upload.single("file"),
  attachEnvelope,
  authRequired,
  requireRole("superAdmin"),
  asyncHandler(createStation)
);
router.post(
  "/updateStations",
  upload.single("file"),
  attachEnvelope,
  authRequired,
  requireRole("superAdmin"),
  asyncHandler(updateStation)
);
router.post(
  "/delete",
  authRequired,
  requireRole("superAdmin"),
  asyncHandler(deleteStation)
);

export default router;
