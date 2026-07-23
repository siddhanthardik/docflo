import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { reviewText, rating, authorName, clinicName, keywords } = await req.json();

    if (!rating || !authorName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); // Fast and efficient for text

    const systemPrompt = `You are the empathetic, professional clinic manager for ${clinicName}.
Your task is to draft a reply to a patient review.
Rules:
1. Speak in a human, empathetic, non-robotic tone. It must sound like it was written by a real person on the clinic staff.
2. The author's name is ${authorName}. Address them appropriately (e.g. "Hi ${authorName},", "Dear ${authorName},").
3. The review has a rating of ${rating} out of 5 stars.
4. If it's a positive review (4-5 stars): Express genuine gratitude, celebrate their positive experience, and wish them well. 
5. If it's a negative/neutral review (1-3 stars): Be deeply empathetic, apologize for their experience, and offer a way to resolve the issue offline (e.g. "please call our front desk"). NEVER be defensive.
6. Local SEO Optimization: Try to naturally weave in ONE or TWO of the following keywords into your response without making it sound forced or spammy. Keywords: ${keywords?.join(", ") || "healthcare services, medical care"}.
7. Keep the response concise but warm (around 3-5 sentences max).
8. Sign off warmly as the team or management at ${clinicName}.

Here is the patient's review (if any):
"${reviewText || "No text provided, only a star rating."}"

Draft the reply now:`;

    const result = await model.generateContent(systemPrompt);
    const replyDraft = result.response.text().trim();

    return NextResponse.json({ draft: replyDraft });

  } catch (error: any) {
    console.error("Error generating draft:", error);
    return NextResponse.json({ error: `Failed to generate draft: ${error.message || "Unknown error"}` }, { status: 500 });
  }
}
