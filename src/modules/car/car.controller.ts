import { Request, Response } from "express";
import { Car } from "../../models/Car";
import { CarFuel } from "../../models/CarFuel";
import { sendOk, ApiError } from "../../utils/response";

/** POST /api/v1/car/getCarsByUserId  — data: { token, id } -> data: ICar[] */
export async function getCarsByUserId(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.id; // scoped to the authenticated user
  const cars = await Car.find({ userId }).sort({ createdAt: -1 });
  sendOk(req, res, cars.map((c) => c.toJSON()));
}

/** POST /api/v1/car/createCars
 *  data: { userId, carBrand, color, plateNumber, engineType, token } -> data: ICar */
export async function createCar(req: Request, res: Response): Promise<void> {
  const { carBrand, color, plateNumber, engineType } = req.payload;
  if (!carBrand || !plateNumber) {
    throw new ApiError("carBrand and plateNumber are required", 400);
  }

  const car = await Car.create({
    userId: req.auth!.id,
    carBrand,
    color: color ?? "",
    plateNumber,
    engineType: engineType ?? "petrol",
  });

  sendOk(req, res, car.toJSON(), 201);
}

/** POST /api/v1/car/deleteCars  — data: { token, id } */
export async function deleteCar(req: Request, res: Response): Promise<void> {
  const { id } = req.payload;
  if (!id) throw new ApiError("Car id is required", 400);

  const car = await Car.findOneAndDelete({ _id: id, userId: req.auth!.id });
  if (!car) throw new ApiError("Mashina topilmadi", 404);

  await CarFuel.deleteMany({ carId: id }); // cascade remove bound fuels
  sendOk(req, res, { id });
}

/** PUT /api/v1/car/:carId  — body: Partial<ICar> (Bearer auth) */
export async function updateCar(req: Request, res: Response): Promise<void> {
  const { carId } = req.params;
  const update: Record<string, any> = {};
  for (const key of ["carBrand", "color", "plateNumber", "engineType"]) {
    if (req.payload[key] !== undefined) update[key] = req.payload[key];
  }

  const car = await Car.findOneAndUpdate(
    { _id: carId, userId: req.auth!.id },
    update,
    { new: true }
  );
  if (!car) throw new ApiError("Mashina topilmadi", 404);

  sendOk(req, res, car.toJSON());
}
