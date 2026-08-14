import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { AIService } from "@/services/ai/AIService";
import { AIFeature } from "@/services/ai/types";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    // 1. Verify module access
    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const body = await req.json();
    const { topic, tone = "professional", targetKeywords = [], imageUrl } = body;

    // Fetch verified doctor & clinic profile to ground AI generation and eliminate hallucinations
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        name: true,
        clinicName: true,
        specialty: true,
        phone: true,
        address: true,
        city: true,
        state: true
      }
    });

    const clinicNameStr = doctor?.clinicName || "our clinic";
    const rawDoctorName = doctor?.name || "";
    const doctorNameStr = rawDoctorName ? (rawDoctorName.toLowerCase().startsWith("dr") ? rawDoctorName : `Dr. ${rawDoctorName}`) : "";
    const specialtyStr = doctor?.specialty || "";
    const phoneStr = doctor?.phone || "";
    const locationStr = [doctor?.address, doctor?.city].filter(Boolean).join(", ");

    const keywordsStr = targetKeywords.length > 0 ? `Include these keywords organically: ${targetKeywords.join(", ")}` : "";
    
    const groundingContext = `
VERIFIED CLINIC PROFILE (MANDATORY STRICT GROUNDING):
- Doctor Name: ${doctorNameStr || "Our Doctor"}
- Clinic Name: ${clinicNameStr}
- Specialty / Focus: ${specialtyStr || "Healthcare Services"}
${phoneStr ? `- Verified Booking Phone Number: ${phoneStr}` : ""}
${locationStr ? `- Verified Clinic Location: ${locationStr}` : ""}

STRICT ANTI-HALLUCINATION RULES:
1. You MUST ONLY write on behalf of ${doctorNameStr ? doctorNameStr + " and " : ""}${clinicNameStr}.
2. ZERO THIRD-PARTY HALLUCINATIONS: NEVER invent or mention external/third-party clinic names (e.g. Krystal Clinic, Sri Sai Children Clinic, etc.), fake phone numbers, or unverified external websites.
3. If an image is provided: Read text on the image carefully. Align with visual themes and text. Do NOT replace the doctor's name or clinic details with any other external business name.
4. Call to Action: If adding a contact line, ONLY use the verified phone (${phoneStr || "our front desk"}) or state "Visit us at ${clinicNameStr}". Never invent external URLs or numbers.
`;

    let prompt = "";
    if (imageUrl) {
      prompt = `${groundingContext}
You are an expert social media manager writing a Google Business Profile update post based on the attached image.
User Request / Topic: ${topic || "Analyze the image content and write an engaging clinic update post for our patients."}
Tone: ${tone}
${keywordsStr}

Write an engaging, warm, professional post (1-2 paragraphs, max 1200 characters) accurately representing the attached image. Include a clear call to action (like 'Call us today' or 'Book a consultation'). Do not use placeholders or third-party clinic names.`;
    } else {
      if (!topic) {
        return NextResponse.json({ error: "Topic or image is required for AI generation" }, { status: 400 });
      }
      prompt = `${groundingContext}
You are an expert social media manager writing a Google Business Profile update post.
Topic: ${topic}
Tone: ${tone}
${keywordsStr}

Write an engaging, warm, professional post (1-2 paragraphs, max 1200 characters). Include a clear call to action (like 'Call us today' or 'Book a consultation'). Do not use placeholders or third-party clinic names.`;
    }

    const aiResult = await AIService.generate(
      doctorId, 
      AIFeature.GBP_POST,
      prompt,
      { temperature: 0.7, imageUrl }
    );

    let cleanContent = (aiResult.content || "").trim();
    // Clean codeblock wrappers if any
    cleanContent = cleanContent
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    // Audit the AI action
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "AI_GENERATE",
        details: { feature: AIFeature.GBP_POST, creditsUsed: aiResult.creditsUsed, hasImage: !!imageUrl },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      content: cleanContent,
      creditsUsed: aiResult.creditsUsed,
      remainingCredits: aiResult.remainingCredits
    });

  } catch (error: any) {
    console.error("Error generating AI Google Post:", error);
    if (error.name === 'InsufficientAICreditsError') {
      return NextResponse.json({ error: error.message }, { status: 402 });
    } else if (error.name === 'ModuleAccessDeniedError') {
      return NextResponse.json({ error: "AI features are not available on your current plan. Please upgrade to unlock this capability." }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || "An unexpected error occurred while generating the post. Please try again later." }, { status: 500 });
  }
}
