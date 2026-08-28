import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed." }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds the 10MB size limit." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    let finalBuffer = rawBuffer;
    let filename: string;

    // Convert all images to high-performance WebP
    if (file.type.startsWith("image/")) {
      try {
        finalBuffer = Buffer.from(await sharp(rawBuffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer());
        filename = `${session.user.id}-${Date.now()}.webp`;
      } catch (sharpError) {
        console.warn("Sharp conversion fallback to raw buffer:", sharpError);
        filename = `${session.user.id}-${Date.now()}.png`;
      }
    } else {
      filename = `${session.user.id}-${Date.now()}.pdf`;
    }

    let uploadDir = path.join(process.cwd(), "public", "uploads");
    if (type === "logo") {
      uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    } else if (type === "announcement") {
      uploadDir = path.join(process.cwd(), "public", "uploads", "announcements");
    } else if (type === "blog" || type === "website" || type === "hero" || type === "gallery") {
      uploadDir = path.join(process.cwd(), "public", "uploads", "blogs");
    }

    await mkdir(uploadDir, { recursive: true }).catch(() => {});

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, finalBuffer);

    const folder = type === "logo" ? "logos/" : type === "announcement" ? "announcements/" : (type === "blog" || type === "website" || type === "hero" || type === "gallery") ? "blogs/" : "";
    const url = `/api/uploads/${folder}${filename}`;

    return NextResponse.json({ url, format: "webp", size: finalBuffer.length });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
