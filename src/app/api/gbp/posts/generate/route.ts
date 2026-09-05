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

    // Fetch verified doctor profile, GBP account details, AND trained "Google Updates Assistant" config to ground AI generation
    const [doctor, agentConfig, gbpAccount] = await Promise.all([
      prisma.doctor.findUnique({
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
      }),
      prisma.aIAgentConfig.findFirst({
        where: {
          doctorId,
          agentType: { in: ["POST_CREATION", "PROFILE"] }
        }
      }),
      prisma.gbpAccount.findFirst({
        where: { doctorId },
        select: {
          locationName: true,
          insightsData: true
        }
      })
    ]);

    const trainedConfig = (agentConfig?.config as any) || {};
    const focusAreas = trainedConfig.focusAreas ? `Focus Treatments & Services: ${trainedConfig.focusAreas}` : "";
    const brandVoice = trainedConfig.brandVoice ? `Clinic Brand Voice: ${trainedConfig.brandVoice}` : "";
    const customRules = trainedConfig.customRules || trainedConfig.instructions ? `Doctor Custom Rules: ${trainedConfig.customRules || trainedConfig.instructions}` : "";
    const preferredCta = trainedConfig.ctaType || "CALL";

    const gbpLocationName = (gbpAccount?.insightsData as any)?.name || gbpAccount?.locationName || "";
    const rawDoctorName = doctor?.name || "";
    const doctorNameStr = rawDoctorName ? (rawDoctorName.toLowerCase().startsWith("dr") ? rawDoctorName : `Dr. ${rawDoctorName}`) : "";
    const clinicNameStr = doctor?.clinicName || gbpLocationName || doctorNameStr || "our clinic";
    const specialtyStr = doctor?.specialty || "";
    const cityStr = doctor?.city || "";

    let keywordsInstruction = "";
    if (targetKeywords.length > 0) {
      keywordsInstruction = `
TARGET SEARCH TOPIC / KEYWORDS:
${targetKeywords.join(", ")}

CRITICAL KEYWORD INTEGRATION RULE:
- Integrate the essence and medical theme of these target search terms NATURALLY and GRAMMATICALLY into the text.
- NEVER dump the raw keyword phrase awkwardly (e.g., DO NOT write "Looking for top-quality Best Gynecologist Delhi?" or "We offer the best Obstetrician near me").
- Instead, express it with natural clinical elegance (e.g., "${doctorNameStr ? doctorNameStr + " provides " : "Our clinic provides "}comprehensive ${specialtyStr ? specialtyStr.toLowerCase() + " " : ""}care and consultations in ${cityStr || "the local community"}...").
`;
    }
    
    const groundingContext = `
VERIFIED CLINIC PROFILE & GOOGLE UPDATES ASSISTANT GUIDELINES:
- Doctor Name: ${doctorNameStr || "Our Specialist"}
- Practice / Clinic Name: ${clinicNameStr}
- Medical Specialty: ${specialtyStr || "Healthcare Practice"}
${cityStr ? `- Practice City: ${cityStr}` : ""}
${focusAreas ? `- ${focusAreas}` : ""}
${brandVoice ? `- ${brandVoice}` : ""}
${customRules ? `- ${customRules}` : ""}
- Target Action Button: ${preferredCta}
${keywordsInstruction}

STRICT GOOGLE CONTENT POLICY & FORMATTING RULES:
1. STRICTLY PLAIN TEXT ONLY: Absolutely DO NOT use markdown bolding (no **asterisks**), no markdown headings (#), and no markdown bullets (* or -). Everything must be pure readable plain text.
2. ZERO PHONE NUMBERS: NEVER write any phone number in the body text (Google strictly bans phone numbers in post text).
3. ZERO STREET ADDRESSES: Do NOT type out the street address in the body text (Google Maps already displays the pinned address on the profile card).
4. ETHICAL HEALTHCARE CONTENT: Share practical wellness insights, treatment benefits, prevention tips, or clinic updates. Never make absolute guarantees or miracle cure claims.
5. CALL TO ACTION: Conclude the post by inviting the patient to take action via the button:
   ${preferredCta === "CALL" ? "Tap 'Call Now' below to consult with " + (doctorNameStr || clinicNameStr) : preferredCta === "BOOK" ? "Tap 'Book' below to schedule your appointment with " + (doctorNameStr || clinicNameStr) : "Tap 'Learn More' below to find out more about our services"}.
`;

    let prompt = "";
    if (imageUrl) {
      prompt = `${groundingContext}
You are the Google Updates Assistant writing an authentic Google Business Profile update post based on the attached image.
User Request / Topic: ${topic || "Analyze the image content and write an engaging clinic update post for our patients."}
Tone: ${tone}

Write an engaging, warm, professional post (1-2 paragraphs, max 800 characters) accurately representing the practice and the image. Include a clear call to action aligning with the button. REMEMBER: DO NOT use markdown asterisks and DO NOT write any phone numbers or street addresses in the text.`;
    } else {
      if (!topic) {
        return NextResponse.json({ error: "Topic or image is required for AI generation" }, { status: 400 });
      }
      prompt = `${groundingContext}
You are the Google Updates Assistant writing an authentic Google Business Profile update post.
Topic: ${topic}
Tone: ${tone}

Write an engaging, warm, professional post (1-2 paragraphs, max 800 characters). Include a clear call to action aligning with the button. REMEMBER: DO NOT use markdown asterisks and DO NOT write any phone numbers or street addresses in the text.`;
    }

    let aiResult;
    try {
      aiResult = await AIService.generate(
        doctorId, 
        AIFeature.GBP_POST,
        prompt,
        { temperature: 0.7, imageUrl }
      );
    } catch (genErr: any) {
      console.warn("AIService primary generation failed, attempting direct OpenAI fallback:", genErr);
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.7
        });
        const content = completion.choices[0]?.message?.content?.trim() || "";
        aiResult = {
          content,
          creditsUsed: 1,
          remainingCredits: 99
        };
      } else {
        throw genErr;
      }
    }

    let cleanContent = (aiResult.content || "").trim();
    // Clean codeblock wrappers if any
    cleanContent = cleanContent
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      // Strip markdown bold and italic asterisks & underscores
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // Remove any accidental phone numbers
      .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/g, "")
      .replace(/[ \t]+/g, " ")
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
    }).catch(() => {});

    return NextResponse.json({
      content: cleanContent,
      suggestedCtaType: preferredCta,
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
    
    return NextResponse.json({ error: "Could not generate post right now. Please try again in a few moments." }, { status: 500 });
  }
}
