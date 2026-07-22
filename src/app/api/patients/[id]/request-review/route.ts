import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReviewDispatcherService } from "@/services/review-dispatcher.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const { id: patientId } = await params;
    const body = await req.json().catch(() => ({}));
    const overrideCooldown = body.overrideCooldown || false;

    // Use dispatcher service for manual sending
    await ReviewDispatcherService.manualSendReviewRequest(patientId, "", doctorId, overrideCooldown);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send review request:", error);
    
    // Check if it's a cooldown error
    if (error.message && error.message.includes("cooldown period")) {
      return NextResponse.json({ error: error.message, isCooldownError: true }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
