import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

// A generic upload abstraction that can be migrated to S3/Supabase later.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // e.g. "logo"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validation: Only allow specific image types and PDFs
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed." }, { status: 400 });
    }

    // Validation: Max size 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds the 5MB size limit." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Secure the filename and create unique ID
    const extension = path.extname(file.name) || ".png";
    const filename = `${session.user.id}-${Date.now()}${extension}`;
    
    // Choose directory based on type
    let uploadDir = path.join(process.cwd(), "public", "uploads");
    if (type === "logo") {
      uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    } else if (type === "announcement") {
      uploadDir = path.join(process.cwd(), "public", "uploads", "announcements");
    }

    const filepath = path.join(uploadDir, filename);

    // Ensure the directory exists
    try {
      await require("fs/promises").mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    // Write file to local disk (Abstraction point: later replace with S3 putObject)
    await writeFile(filepath, buffer);

    // Return the relative URL
    const folder = type === "logo" ? "logos/" : type === "announcement" ? "announcements/" : "";
    const url = `/uploads/${folder}${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
