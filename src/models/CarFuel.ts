import { Schema, model, Document, Types } from "mongoose";

/** Fuel type bound to a specific car. Client reads `_id` and nested `gasCategory`. */
export interface ICarFuel extends Document {
  _id: Types.ObjectId;
  carId: Types.ObjectId;
  gasCategoryId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const carFuelSchema = new Schema<ICarFuel>(
  {
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true, index: true },
    gasCategoryId: { type: Schema.Types.ObjectId, ref: "GasCategory", required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        // keep `_id` — the client depends on carFuel._id
        delete ret.__v;
        return ret;
      },
    },
  }
);

carFuelSchema.index({ carId: 1, gasCategoryId: 1 }, { unique: true });

export const CarFuel = model<ICarFuel>("CarFuel", carFuelSchema);
