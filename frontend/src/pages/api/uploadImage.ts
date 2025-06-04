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

    const pageType = Array.isArray(fields.pageType) ? fields.pageType[0] : fields.pageType || "misc";
    const pageName = Array.isArray(fields.pageName) ? fields.pageName[0] : fields.pageName || "general";
    const customFileName = Array.isArray(fields.customFileName)
      ? fields.customFileName[0]
      : fields.customFileName;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const dir = path.join(process.cwd(), "uploads/images/pages", pageType, pageName);
    fs.mkdirSync(dir, { recursive: true });

    // File extension
    const fileExt = path.extname(file.originalFilename || file.name || "upload").toLowerCase();

    // Clean base name
    const baseName =
      (file.originalFilename || file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_");

    // Use customFileName if present, otherwise use the base name so repeated
    // uploads replace the previous file
    const fileName = customFileName
      ? `${customFileName}${fileExt}`
      : `${baseName}`;
    const dest = path.join(dir, fileName);

    // Delete unknown old file with the same name to avoid duplicates
    if (fs.existsSync(dest)) fs.unlinkSync(dest);

    // Robust: check for filepath (formidable v3+), fallback to path (v2)
    const tempPath = (file as any).filepath || (file as any).path;
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

    res.status(200).json({
      url: `/uploads/images/pages/${pageType}/${pageName}/${fileName}`.replace(/\/+/g, "/"),
    });
  });
}
