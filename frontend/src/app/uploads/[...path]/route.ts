import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { lookup as mimeLookup } from 'mime-types';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path || [];
  const filePath = path.join(process.cwd(), "uploads", ...segments);
  try {
    const data = await fs.readFile(filePath);
    const mimeType = mimeLookup(filePath) || 'application/octet-stream';
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': mimeType.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return new NextResponse('File not found', { status: 404 });
  }
}
