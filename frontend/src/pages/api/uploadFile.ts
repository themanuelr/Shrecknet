import type { NextApiRequest, NextApiResponse } from "next";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).json({ error: String(err) });
      return;
    }

    let file = files.file as formidable.File | formidable.File[] | undefined;
    if (Array.isArray(file)) file = file[0];

    const folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder || "misc";
    const customFileName = Array.isArray(fields.filename)
      ? fields.filename[0]
      : fields.filename;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    if (!folder) {
      res.status(400).json({ error: "No folder specified" });
      return;
    }

    const dir = path.join(process.cwd(), "public/images", folder);
    fs.mkdirSync(dir, { recursive: true });

    const fileExt = path.extname(file.originalFilename || file.name || "upload").toLowerCase();
    const baseName =
      (file.originalFilename || file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_");

    const fileName = customFileName
      ? `${customFileName}${fileExt}`
      : `${Date.now()}_${baseName}`;
    const dest = path.join(dir, fileName);

    if (fs.existsSync(dest)) fs.unlinkSync(dest);

    const tempPath = (file as unknown).filepath || (file as unknown).path;
    if (!tempPath) {
      res.status(400).json({ error: "File path not found for upload" });
      return;
    }

    // --- PATCH: Use copy + unlink instead of rename ---
    try {
      fs.copyFileSync(tempPath, dest);
      fs.unlinkSync(tempPath);
    } catch (copyErr) {
      res.status(500).json({ error: `Error saving file: ${String(copyErr)}` });
      return;
    }
    // -------------------------------------------------

    res.status(200).json({ url: `/images/${folder}/${fileName}`.replace(/\/+/g, "/") });
  });
}
