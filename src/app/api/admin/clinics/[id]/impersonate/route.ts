import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !hasPermission(session.user?.role || "", "MANAGE_USERS")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clinic = await prisma.doctor.findUnique({
      where: { id },
      select: { email: true }
    });

    if (!clinic) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

    // Generate a short-lived impersonation token (5 minutes)
    const token = jwt.sign(
      { email: clinic.email, impersonate: true },
      process.env.NEXTAUTH_SECRET || "secret",
      { expiresIn: "5m" }
    );

    return NextResponse.json({ 
      email: clinic.email,
      token: `impersonate_${token}` 
    });
  } catch (error) {
    console.error("Impersonation error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
