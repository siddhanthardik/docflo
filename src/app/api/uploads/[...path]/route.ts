import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

async function resolveFilePath(params: any): Promise<{ filePath: string; contentType: string } | null> {
  const resolvedParams = await params;
  const filePathArray = resolvedParams.path;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, ...filePathArray);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(uploadDir)) {
    return null;
  }

  const ext = path.extname(filePath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".pdf") contentType = "application/pdf";

  return { filePath, contentType };
}

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const resolved = await resolveFilePath(params);
    if (!resolved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileBuffer = await readFile(resolved.filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": resolved.contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

// Googlebot-Image frequently sends HEAD requests to inspect image dimensions, size, and Content-Type
export async function HEAD(req: Request, { params }: { params: any }) {
  try {
    const resolved = await resolveFilePath(params);
    if (!resolved) {
      return new NextResponse(null, { status: 401 });
    }

    const fileStat = await stat(resolved.filePath);

    return new NextResponse(null, {
      headers: {
        "Content-Type": resolved.contentType,
        "Content-Length": fileStat.size.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 404 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
