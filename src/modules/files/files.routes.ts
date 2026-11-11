import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { UPLOAD_DIR } from "../../middleware/upload";

const router = Router();

/** GET /api/v1/files/:filename — serves an uploaded station image. */
router.get("/:filename", (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename); // block path traversal
  const full = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(full)) {
    res.status(404).json({ status: "error", error: "File not found", data: null });
    return;
  }
  res.sendFile(full);
});

export default router;
