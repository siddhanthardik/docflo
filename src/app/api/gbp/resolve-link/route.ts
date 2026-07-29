import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { resolveGoogleReviewLink } from "@/services/review-dispatcher.service";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewLink = await resolveGoogleReviewLink(doctorId);
    return NextResponse.json({ success: true, link: reviewLink });
  } catch (error: any) {
    console.error("Failed to resolve Google review link:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve link" }, { status: 500 });
  }
}
