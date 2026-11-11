import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRequired } from "../../middleware/auth";
import { getCarsByUserId, createCar, deleteCar, updateCar } from "./car.controller";

const router = Router();

router.post("/getCarsByUserId", authRequired, asyncHandler(getCarsByUserId));
router.post("/createCars", authRequired, asyncHandler(createCar));
router.post("/deleteCars", authRequired, asyncHandler(deleteCar));
router.put("/:carId", authRequired, asyncHandler(updateCar));

export default router;
