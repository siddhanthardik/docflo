import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { AIService } from "@/services/ai/AIService";
import { AIFeature } from "@/services/ai/types";
import { toHumanFriendlyAIError } from "@/services/ai/ai-error-formatter";
import { sanitizeGbpPost } from "@/lib/gbp-post-utils";

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
2. ZERO PHONE NUMBERS: NEVER write any phone number in the body text (Google strictly bans phone numbers in post text to prevent spam). Patients will use the native action button.
3. ZERO STREET ADDRESSES OR URLS: Do NOT type out the street address or website links in the body text (Google Maps already displays the clinic map pin and website button).
4. ETHICAL HEALTHCARE CONTENT: Share practical wellness insights, treatment benefits, preventive tips, or clinic updates. NEVER make absolute guarantees, miracle cure claims, or 100% cure promises.
5. STRICT ANTI-SPAM & ANTI-ROBOTIC BANNED WORDS:
   NEVER use corporate AI clichés, commercial sales words, marketing hype, or spammy gimmicks:
   - Commercial / Spam words: DO NOT write "great deal", "best deal", "deal", "special discount", "50% off", "exclusive offer", "unbeatable price", "value for money".
   - Melodramatic / Robotic filler: DO NOT write "game-changer", "unwavering commitment", "strive for excellence", "beacon of hope", "testament to", "look no further", "in today's fast-paced world", "delighted to announce", "thrilled to share", "dive deep into", "exceptional healthcare journey", "rest assured", "kudos".
   - Unethical Medical Guarantees: DO NOT write "guaranteed cure", "miracle cure", "100% cure", "permanent fix".
6. NATURAL, INFORMATIVE CLINIC VOICE:
   - Write with the warmth, dignity, and calm authority of a trusted healthcare clinic.
   - Educate patients with practical tips, symptom recognition, and wellness guidance.
   - Format into 2-3 short, clean paragraphs separated by blank lines. Optimal length: 80 to 120 words.
7. CALL TO ACTION (CTA): Conclude with a clear instruction matching the selected action button:
   ${preferredCta === "CALL" ? "Tap 'Call Now' below to consult with " + (doctorNameStr || clinicNameStr) + "." : preferredCta === "BOOK" ? "Tap 'Book' below to schedule an appointment with " + (doctorNameStr || clinicNameStr) + "." : "Tap 'Learn More' below to find out more about our services."}
`;

    let prompt = "";
    if (imageUrl) {
      prompt = `${groundingContext}
You are the Google Updates Assistant writing an authentic Google Business Profile update post based on the attached image.
User Request / Topic: ${topic || "Analyze the image content and write an engaging clinic update post for our patients."}
Tone: ${tone}

Write an engaging, warm, professional post (2-3 short paragraphs, 80-120 words). Include a clear call to action aligning with the button. REMEMBER: DO NOT use markdown asterisks, DO NOT write any phone numbers or URLs in the text, and DO NOT use spammy marketing words or AI clichés.`;
    } else {
      if (!topic) {
        return NextResponse.json({ error: "Topic or image is required for AI generation" }, { status: 400 });
      }
      prompt = `${groundingContext}
You are the Google Updates Assistant writing an authentic Google Business Profile update post.
Topic: ${topic}
Tone: ${tone}

Write an engaging, warm, professional post (2-3 short paragraphs, 80-120 words). Include a clear call to action aligning with the button. REMEMBER: DO NOT use markdown asterisks, DO NOT write any phone numbers or URLs in the text, and DO NOT use spammy marketing words or AI clichés.`;
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
      // If entitlement or credit error, rethrow immediately so toHumanFriendlyAIError formats it
      if (genErr.name === 'InsufficientAICreditsError' || genErr.name === 'ModuleAccessDeniedError') {
        throw genErr;
      }

      console.warn("AIService primary generation failed, attempting direct OpenAI fallback:", genErr);
      let fallbackSuccess = false;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey: openaiKey });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 600,
            temperature: 0.7
          });
          const content = completion.choices[0]?.message?.content?.trim() || "";
          if (content) {
            aiResult = {
              content,
              creditsUsed: 1,
              remainingCredits: 99
            };
            fallbackSuccess = true;
          }
        } catch (oErr) {
          console.warn("Direct OpenAI fallback also failed:", oErr);
        }
      }

      if (!fallbackSuccess) {
        throw genErr;
      }
    }

    if (!aiResult) {
      throw new Error("Failed to generate post content. Please try again.");
    }

    // Tier 2 Gatekeeper: Sanitize, strip asterisks, clean phone numbers, scrub AI clichés, format paragraphs
    const cleanContent = sanitizeGbpPost(aiResult.content, preferredCta, doctorNameStr || clinicNameStr);

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
    const friendlyMsg = toHumanFriendlyAIError(error);
    const statusCode = error.status || (
      error.name === 'InsufficientAICreditsError' ? 402 :
      error.name === 'ModuleAccessDeniedError' ? 403 :
      500
    );
    
    return NextResponse.json({ error: friendlyMsg }, { status: statusCode });
  }
}
