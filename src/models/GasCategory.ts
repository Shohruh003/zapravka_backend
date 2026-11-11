import { Schema, model, Document, Types } from "mongoose";

/** Fuel type, e.g. AI-92, Propan, Metan, Elektr. Exposed with `id` (not _id). */
export interface IGasCategory extends Document {
  _id: Types.ObjectId;
  name_uz: string;
  name_ru: string;
  /** which station "type" bucket this fuel belongs to: benzine | gas | diesel | electric */
  kind: string;
  /** suggested price (so'm) used to prefill a station's fuel prices on create */
  defaultPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const gasCategorySchema = new Schema<IGasCategory>(
  {
    name_uz: { type: String, required: true },
    name_ru: { type: String, required: true },
    kind: {
      type: String,
      enum: ["benzine", "gas", "diesel", "electric"],
      default: "benzine",
    },
    defaultPrice: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const GasCategory = model<IGasCategory>("GasCategory", gasCategorySchema);
