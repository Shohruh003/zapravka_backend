import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  const { host, port, name } = mongoose.connection;
  console.log(`✅ MongoDB connected: ${host}:${port}/${name}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
