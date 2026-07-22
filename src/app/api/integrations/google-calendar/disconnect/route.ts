import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.doctor.update({
      where: { id: session.user.id },
      data: {
        gcalAccessToken: null,
        gcalRefreshToken: null,
        gcalConnectedAt: null,
      } as any,
    });

    return NextResponse.json({ success: true, message: "Google Calendar disconnected successfully" });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return NextResponse.json({ error: "Failed to disconnect Google Calendar" }, { status: 500 });
  }
}
