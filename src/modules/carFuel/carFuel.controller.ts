import { Request, Response } from "express";
import { CarFuel } from "../../models/CarFuel";
import { Car } from "../../models/Car";
import { sendOk, ApiError } from "../../utils/response";

const POP = { path: "gasCategoryId", model: "GasCategory" };

/** Serializes a CarFuel into the shape the client expects:
 *  { _id, carId, gasCategoryId, createdAt, updatedAt, gasCategory: IGasCategory } */
function serializeCarFuel(cf: any): any {
  const c = cf.toObject ? cf.toObject() : cf;
  const cat = c.gasCategoryId && typeof c.gasCategoryId === "object" ? c.gasCategoryId : null;
  return {
    _id: c._id?.toString(),
    carId: c.carId?.toString(),
    gasCategoryId: (cat?._id ?? c.gasCategoryId)?.toString(),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    gasCategory: cat
      ? {
          id: cat._id?.toString(),
          name_uz: cat.name_uz,
          name_ru: cat.name_ru,
          kind: cat.kind,
        }
      : null,
  };
}

/** Ensures the car exists and belongs to the authenticated user. */
async function assertCarOwned(carId: string, userId: string) {
  const car = await Car.findOne({ _id: carId, userId });
  if (!car) throw new ApiError("Mashina topilmadi", 404);
  return car;
}

/** POST /api/v1/carFuel/getCarFuelsByCarId  — data: { token, carId } -> data: ICarFuel[] */
export async function getCarFuelsByCarId(req: Request, res: Response): Promise<void> {
  const { carId } = req.payload;
  if (!carId) throw new ApiError("carId is required", 400);

  await assertCarOwned(carId, req.auth!.id); // ownership check (no cross-user read)

  const fuels = await CarFuel.find({ carId }).populate(POP).sort({ createdAt: 1 });
  sendOk(req, res, fuels.map(serializeCarFuel));
}

/** POST /api/v1/carFuel/createCarFuels  — data: { token, carId, gasCategoryId } -> data: ICarFuel */
export async function createCarFuel(req: Request, res: Response): Promise<void> {
  const { carId, gasCategoryId } = req.payload;
  if (!carId || !gasCategoryId) throw new ApiError("carId and gasCategoryId are required", 400);

  await assertCarOwned(carId, req.auth!.id);

  let fuel = await CarFuel.findOne({ carId, gasCategoryId });
  if (!fuel) fuel = await CarFuel.create({ carId, gasCategoryId });

  await fuel.populate(POP);
  sendOk(req, res, serializeCarFuel(fuel), 201);
}

/** POST /api/v1/carFuel/deleteCarFuels  — data: { token, id } */
export async function deleteCarFuel(req: Request, res: Response): Promise<void> {
  const { id } = req.payload;
  if (!id) throw new ApiError("carFuel id is required", 400);

  const fuel = await CarFuel.findById(id);
  if (!fuel) throw new ApiError("Yoqilg'i topilmadi", 404);

  // ownership: the fuel's car must belong to the requesting user
  await assertCarOwned(fuel.carId.toString(), req.auth!.id);

  await fuel.deleteOne();
  sendOk(req, res, { id });
}
