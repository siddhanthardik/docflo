import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { ReviewDispatcherService } from "@/services/review-dispatcher.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
