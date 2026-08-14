import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AIService } from "@/services/ai/AIService";
import { AIFeature } from "@/services/ai/types";
import { toHumanFriendlyAIError } from "@/services/ai/ai-error-formatter";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to draft AI replies." }, { status: 401 });
    }

    const { reviewText, rating, authorName, clinicName, keywords } = await req.json();

    if (!rating || !authorName) {
      return NextResponse.json({ error: "Missing required review fields" }, { status: 400 });
    }

    const prompt = `You are the empathetic, professional clinic manager for ${clinicName || "our clinic"}.
Your task is to draft a complete reply to a patient review.
Rules:
1. Speak in a human, empathetic, non-robotic tone. It must sound like it was written by a real person on the clinic staff.
2. The author's name is ${authorName}. Address them appropriately (e.g. "Hi ${authorName},", "Dear ${authorName},").
3. The review has a rating of ${rating} out of 5 stars.
4. If it's a positive review (4-5 stars): Express genuine gratitude, celebrate their positive experience, and wish them well. 
5. If it's a negative/neutral review (1-3 stars): Be deeply empathetic, apologize for their experience, and offer a way to resolve the issue offline (e.g. "please call our front desk"). NEVER be defensive.
6. Local SEO Optimization: Try to naturally weave in ONE or TWO of the following keywords into your response without making it sound forced or spammy. Keywords: ${keywords?.join(", ") || "healthcare services, medical care"}.
7. Keep the response concise but warm (around 3-5 sentences max).
8. Sign off warmly as the team or management at ${clinicName || "our clinic"}.
9. IMPORTANT: Respond ONLY with the text of the reply. Do NOT enclose in markdown codeblocks or quotes. Write a complete, fully-formed response with proper ending sign-off. Never cut off mid-sentence.

Here is the patient's review (if any):
"${reviewText || "No text provided, only a star rating."}"

Draft the complete reply now:`;

    const result = await AIService.generate(
      session.user.id,
      AIFeature.REVIEW_REPLY,
      prompt,
      { temperature: 0.7, maxTokens: 1500 }
    );

    let cleanDraft = (result.content || "").trim();
    // Clean surrounding quotes or markdown blocks if model included them
    cleanDraft = cleanDraft
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .replace(/^["']|["']$/g, "")
      .trim();

    return NextResponse.json({ 
      draft: cleanDraft,
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
