import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const filePathArray = resolvedParams.path;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, ...filePathArray);

    // Basic security check to prevent directory traversal
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileBuffer = await readFile(filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
