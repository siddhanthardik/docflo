import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + "_" + file.name.replace(/\s+/g, '_');
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      await writeFile(join(uploadDir, filename), buffer);
    } catch (e: any) {
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);
      } else {
        throw e;
      }
    }

    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ url: fileUrl, success: true });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ error: "Failed to save file." }, { status: 500 });
  }
}
