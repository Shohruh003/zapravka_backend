import { Schema, model, Document, Types } from "mongoose";

export type EngineType = "hybrid" | "diesel" | "petrol" | "electric";

/** Car — the client reads `_id` (not `id`), so we keep `_id` in JSON. */
export interface ICar extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  carBrand: string;
  color: string;
  plateNumber: string;
  engineType: EngineType;
  createdAt: Date;
  updatedAt: Date;
}

const carSchema = new Schema<ICar>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carBrand: { type: String, required: true },
    color: { type: String, default: "" },
    plateNumber: { type: String, required: true },
    engineType: {
      type: String,
      enum: ["hybrid", "diesel", "petrol", "electric"],
      default: "petrol",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        // keep `_id` — the client depends on car._id
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Car = model<ICar>("Car", carSchema);
