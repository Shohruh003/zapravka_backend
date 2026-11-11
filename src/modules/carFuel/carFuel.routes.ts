import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired } from "../../middleware/auth";
import { getCarFuelsByCarId, createCarFuel, deleteCarFuel } from "./carFuel.controller";

const router = Router();

router.post("/getCarFuelsByCarId", authRequired, asyncHandler(getCarFuelsByCarId));
router.post("/createCarFuels", authRequired, asyncHandler(createCarFuel));
router.post("/deleteCarFuels", authRequired, asyncHandler(deleteCarFuel));

export default router;
