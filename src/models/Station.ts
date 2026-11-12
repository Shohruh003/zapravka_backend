import { Schema, model, Document, Types } from "mongoose";

export interface IStationGasCategory {
  gasCategoryId: Types.ObjectId;
  price: number;
  available: number;
}

export interface IBusinessHour {
  dayOfWeek: number; // ISO weekday: 1=Monday ... 7=Sunday (the client relies on this)
  startTimeHour: string;
  startTimeMinute: string;
  endTimeHour: string;
  endTimeMinute: string;
  isAvailable: boolean;
}

export interface IStation extends Document {
  _id: Types.ObjectId;
  name: string;
  address: string;
  userId?: Types.ObjectId; // station admin who manages it
  latitude: number;
  longitude: number;
  filePath?: string; // stored filename
  phoneNumber?: string;
  type: string[]; // ["gas","electric","diesel","benzine"]
  gasCategories: IStationGasCategory[];
  businessHours: IBusinessHour[];
  location: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  createdAt: Date;
  updatedAt: Date;
}

const stationGasCategorySchema = new Schema<IStationGasCategory>(
  {
    gasCategoryId: { type: Schema.Types.ObjectId, ref: "GasCategory", required: true },
    price: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

const businessHourSchema = new Schema<IBusinessHour>(
  {
    dayOfWeek: { type: Number, required: true },
    startTimeHour: { type: String, default: "08" },
    startTimeMinute: { type: String, default: "00" },
    endTimeHour: { type: String, default: "23" },
    endTimeMinute: { type: String, default: "00" },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);

const stationSchema = new Schema<IStation>(
  {
    name: { type: String, required: true, index: true },
    address: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    filePath: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    type: { type: [String], default: [] },
    gasCategories: { type: [stationGasCategorySchema], default: [] },
    businessHours: { type: [businessHourSchema], default: [] },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
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

stationSchema.index({ location: "2dsphere" });

export const Station = model<IStation>("Station", stationSchema);
