import { Request, Response } from "express";
import { GasCategory } from "../../models/GasCategory";
import { sendOk } from "../../utils/response";
import { escapeRegex } from "../../utils/regex";

/** POST /api/v1/gasCategory/getGasCategories
 *  data: { token, name_uz, name_ru, limit, page } -> data: IGasCategory[] */
export async function getGasCategories(req: Request, res: Response): Promise<void> {
  const { name_uz, name_ru } = req.payload;
  const limit = Math.min(Number(req.payload.limit) || 100, 200);
  const page = Math.max(Number(req.payload.page) || 1, 1);

  const filter: Record<string, any> = {};
  if (name_uz) filter.name_uz = { $regex: escapeRegex(name_uz), $options: "i" };
  if (name_ru) filter.name_ru = { $regex: escapeRegex(name_ru), $options: "i" };

  const cats = await GasCategory.find(filter)
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  sendOk(req, res, cats.map((c) => c.toJSON()));
}
