// pages/api/uploadPdf.ts

import { writeFile, mkdir } from "fs/promises";
import { NextRequest } from "next/server";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};


export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pageID = formData.get("pageID") as string;
  
    if (!file || !pageID) {
      return new Response(JSON.stringify({ error: "Missing file or pageID" }), { status: 400 });
    }
  
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
  
    const dir = join(process.cwd(), "uploads", "pdfs", "pages", pageID);
    await mkdir(dir, { recursive: true });
  
    const filename = `${uuidv4()}.pdf`;
    const filepath = join(dir, filename);
    await writeFile(filepath, buffer);
  
    const publicUrl = `/uploads/pdfs/pages/${pageID}/${filename}`;
    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }