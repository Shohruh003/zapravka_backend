import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { env, isDev } from "./config/env";
import { attachEnvelope } from "./middleware/envelope";
import { notFound, errorHandler } from "./middleware/error";
import apiRoutes from "./routes";

export function createApp(): Application {
  const app = express();

  // CORS — reflect any origin when "*", otherwise restrict to the configured list.
  const allowAll = env.corsOrigins.includes("*");
  // The frontends auth via localStorage bearer tokens (not cookies), so we don't need
  // credentials. Reflecting any origin WITH credentials is forbidden by the CORS spec,
  // so only enable credentials when an explicit allow-list is configured.
  app.use(
    cors({
      origin: allowAll ? true : env.corsOrigins,
      credentials: !allowAll,
    })
  );

  if (isDev) app.use(morgan("dev"));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Normalize the request envelope for JSON routes (multipart routes re-run it after multer).
  app.use(attachEnvelope);

  // Health check
  app.get(["/", "/health"], (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "zapravka-backend", version: "1.0.0" });
  });

  app.use("/api/v1", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
