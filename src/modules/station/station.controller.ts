import { Request, Response } from "express";
import { Station } from "../../models/Station";
import { User } from "../../models/User";
import { sendOk, ApiError } from "../../utils/response";
import { escapeRegex } from "../../utils/regex";
import { serializeStation } from "./station.serializer";
import {
  buildGasCategoriesForTypes,
  defaultBusinessHours,
  parseTypes,
} from "./station.helpers";

const POP = { path: "gasCategories.gasCategoryId", model: "GasCategory" };

/** POST /api/v1/station/getStations
 *  data: { token, latitude, longitude, name?, gasCategoryId?: string[], limit, page } */
export async function getStations(req: Request, res: Response): Promise<void> {
  const { name, gasCategoryId } = req.payload;
  const latitude = Number(req.payload.latitude) || 0;
  const longitude = Number(req.payload.longitude) || 0;
  const limit = Math.min(Number(req.payload.limit) || 20, 100);
  const page = Math.max(Number(req.payload.page) || 1, 1);

  const filter: Record<string, any> = {};
  if (name) filter.name = { $regex: escapeRegex(name), $options: "i" };
  if (Array.isArray(gasCategoryId) && gasCategoryId.length) {
    filter["gasCategories.gasCategoryId"] = { $in: gasCategoryId };
  }

  const hasGeo = latitude !== 0 && longitude !== 0;
  if (hasGeo) {
    filter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
      },
    };
  }

  // $near already orders by distance; skip works on both branches for proper pagination.
  let q = Station.find(filter).populate(POP).skip((page - 1) * limit).limit(limit);
  if (!hasGeo) q = q.sort({ createdAt: -1 });

  const stations = await q.exec();
  sendOk(req, res, stations.map(serializeStation));
}

/** POST /api/v1/station/getStationsById  — data: { token, id } */
export async function getStationById(req: Request, res: Response): Promise<void> {
  const { id } = req.payload;
  if (!id) throw new ApiError("Station id is required", 400);

  const station = await Station.findById(id).populate(POP);
  if (!station) throw new ApiError("Shoxobcha topilmadi", 404);

  sendOk(req, res, serializeStation(station));
}

/** POST /api/v1/station/dashboard  — data: { token }  -> returns an array with one stats object */
export async function dashboard(req: Request, res: Response): Promise<void> {
  const [
    allStationsCount,
    petrolStationsCount,
    gasStationsCount,
    powerStationsCount,
    dizelStationsCount,
    stationsAdminsCount,
  ] = await Promise.all([
    Station.countDocuments({}),
    Station.countDocuments({ type: "benzine" }),
    Station.countDocuments({ type: "gas" }),
    Station.countDocuments({ type: "electric" }),
    Station.countDocuments({ type: "diesel" }),
    User.countDocuments({ role: "stationAdmin" }),
  ]);

  sendOk(req, res, [
    {
      allStationsCount,
      petrolStationsCount,
      gasStationsCount,
      powerStationsCount,
      dizelStationsCount,
      stationsAdminsCount,
    },
  ]);
}

/** POST /api/v1/station/createStations  — multipart form-data */
export async function createStation(req: Request, res: Response): Promise<void> {
  const body = req.payload;
  const name = body.name;
  const address = body.address ?? "";
  const phoneNumber = (body.phoneNumber ?? "").toString().replace(/^\+/, "");
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const userId = body.user_id || undefined; // assigned station admin
  const types = parseTypes(body.type);

  if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError("name, latitude and longitude are required", 400);
  }

  const gasCategories = await buildGasCategoriesForTypes(types);

  const station = await Station.create({
    name,
    address,
    phoneNumber,
    latitude,
    longitude,
    userId: userId || null,
    type: types,
    filePath: req.file?.filename ?? "",
    gasCategories,
    businessHours: defaultBusinessHours(),
    location: { type: "Point", coordinates: [longitude, latitude] },
  });

  await station.populate(POP);
  sendOk(req, res, serializeStation(station), 201);
}

/** POST /api/v1/station/updateStations  — multipart form-data */
export async function updateStation(req: Request, res: Response): Promise<void> {
  const body = req.payload;
  const stationId = body.stationId || body.id;
  if (!stationId) throw new ApiError("stationId is required", 400);

  const station = await Station.findById(stationId);
  if (!station) throw new ApiError("Shoxobcha topilmadi", 404);

  if (body.name !== undefined) station.name = body.name;
  if (body.address !== undefined) station.address = body.address;
  if (body.phoneNumber !== undefined)
    station.phoneNumber = String(body.phoneNumber).replace(/^\+/, "");
  if (body.user_id !== undefined) station.userId = body.user_id || null;

  const newLat = body.latitude !== undefined ? Number(body.latitude) : station.latitude;
  const newLng = body.longitude !== undefined ? Number(body.longitude) : station.longitude;
  station.latitude = newLat;
  station.longitude = newLng;
  station.location = { type: "Point", coordinates: [newLng, newLat] };

  if (body.type !== undefined) {
    const types = parseTypes(body.type);
    station.type = types;
    // Rebuild the fuel list to match the new types, preserving price/available for kept fuels.
    const rebuilt = await buildGasCategoriesForTypes(types);
    const prev = new Map(
      station.gasCategories.map((gc: any) => [gc.gasCategoryId.toString(), gc])
    );
    station.gasCategories = rebuilt.map((gc) => {
      const existing: any = prev.get(gc.gasCategoryId.toString());
      return existing
        ? { gasCategoryId: gc.gasCategoryId, price: existing.price, available: existing.available }
        : gc;
    }) as any;
  }

  if (req.file?.filename) station.filePath = req.file.filename;

  await station.save();
  await station.populate(POP);
  sendOk(req, res, serializeStation(station));
}

/** POST /api/v1/station/delete  — data: { id, token } */
export async function deleteStation(req: Request, res: Response): Promise<void> {
  const { id } = req.payload;
  if (!id) throw new ApiError("Station id is required", 400);

  const deleted = await Station.findByIdAndDelete(id);
  if (!deleted) throw new ApiError("Shoxobcha topilmadi", 404);

  sendOk(req, res, { id });
}
