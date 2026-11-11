import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import profileRoutes from "../modules/profile/profile.routes";
import stationRoutes from "../modules/station/station.routes";
import gasCategoryRoutes from "../modules/gasCategory/gasCategory.routes";
import carRoutes from "../modules/car/car.routes";
import carFuelRoutes from "../modules/carFuel/carFuel.routes";
import stationAdminRoutes from "../modules/stationAdmin/stationAdmin.routes";
import filesRoutes from "../modules/files/files.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/station", stationRoutes);
router.use("/gasCategory", gasCategoryRoutes);
router.use("/car", carRoutes);
router.use("/carFuel", carFuelRoutes);
router.use("/stationAdmin", stationAdminRoutes);
router.use("/files", filesRoutes);

export default router;
