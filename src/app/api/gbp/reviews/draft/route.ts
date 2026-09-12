import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { ReviewReplyService } from "@/services/ai/review-reply.service";
import { toHumanFriendlyAIError } from "@/services/ai/ai-error-formatter";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to draft AI replies." }, { status: 401 });
    }

    const { reviewText, rating, authorName, clinicName, keywords } = await req.json();

    if (!rating) {
      return NextResponse.json({ error: "Missing required review rating" }, { status: 400 });
    }

    const result = await ReviewReplyService.generateReply({
      doctorId,
      reviewText,
      rating,
      authorName,
      clinicName,
      keywords,
    });

    return NextResponse.json({ 
      draft: result.reply,
      creditsUsed: result.creditsUsed,
      remainingCredits: result.remainingCredits
    });

  } catch (error: any) {
    console.error("Error generating review draft:", error);
    const friendlyMsg = toHumanFriendlyAIError(error);
    const statusCode = error.status || (error.name === 'InsufficientAICreditsError' ? 402 : error.name === 'ModuleAccessDeniedError' ? 403 : 500);
    
    return NextResponse.json({ error: friendlyMsg }, { status: statusCode });
  }
}
