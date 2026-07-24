import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "SALES"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { doctorId } = body;

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set("gyrex_impersonate", doctorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return NextResponse.json({ success: true, redirectUrl: "/dashboard" });
  } catch (error: any) {
    console.error("Impersonate Error:", error);
    return NextResponse.json({ error: "Failed to impersonate" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    // We allow anyone with a session to stop impersonating, as long as they have the cookie
    const cookieStore = await cookies();
    cookieStore.delete("gyrex_impersonate");

    return NextResponse.json({ success: true, redirectUrl: "/admin/clinics" });
  } catch (error: any) {
    console.error("Stop Impersonate Error:", error);
    return NextResponse.json({ error: "Failed to stop impersonating" }, { status: 500 });
  }
}
