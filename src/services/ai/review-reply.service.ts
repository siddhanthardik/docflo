import { prisma } from "@/lib/prisma";
import { AIService } from "./AIService";
import { AIFeature } from "./types";
import { formatDoctorDisplayName } from "@/lib/utils";

export interface ReviewReplyInput {
  doctorId: string;
  reviewText?: string;
  rating: number;
  authorName?: string;
  clinicName?: string;
  keywords?: string[];
  customInstructions?: string;
}

export class ReviewReplyService {
  /**
   * Generates a warm, authentic, human clinic staff review reply
   */
  static async generateReply(input: ReviewReplyInput): Promise<{
    reply: string;
    creditsUsed: number;
    remainingCredits: number;
  }> {
    const { doctorId, reviewText, rating, authorName, keywords, customInstructions } = input;

    // 1. Fetch Doctor Profile, GBP Account, and Review Agent Config in parallel
    const [doctor, gbpAccount, agentConfig] = await Promise.all([
      prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          name: true,
          clinicName: true,
          specialty: true,
          city: true,
        },
      }),
      prisma.gbpAccount.findFirst({
        where: { doctorId },
        select: {
          locationName: true,
          insightsData: true,
        },
      }),
      prisma.aIAgentConfig.findFirst({
        where: {
          doctorId,
          agentType: "REVIEW",
        },
      }),
    ]);

    const doctorName = doctor ? formatDoctorDisplayName(doctor.name) : "";
    const gbpLocationName =
      (gbpAccount?.insightsData as any)?.name || gbpAccount?.locationName || "";
    const clinicName =
      input.clinicName || doctor?.clinicName || gbpLocationName || doctorName || "our clinic";
    const specialty = doctor?.specialty || "";
    const city = doctor?.city || "";

    const savedConfig = (agentConfig?.config as any) || {};
    const instructions =
      customInstructions || savedConfig.instructions || savedConfig.customRules || "";
    
    // Combine explicit keywords with saved keywords
    const savedKeywords = savedConfig.targetKeywords
      ? savedConfig.targetKeywords.split(",").map((k: string) => k.trim())
      : [];
    const allKeywords = Array.from(new Set([...(keywords || []), ...savedKeywords])).filter(
      Boolean
    );

    // Format author name respectfully
    let cleanAuthor = (authorName || "").trim();
    if (
      !cleanAuthor ||
      cleanAuthor.toLowerCase() === "google user" ||
      cleanAuthor.toLowerCase() === "anonymous" ||
      cleanAuthor.toLowerCase() === "valued patient"
    ) {
      cleanAuthor = "";
    } else {
      // If full name, take the first name for a warmer human address
      const parts = cleanAuthor.split(/\s+/);
      cleanAuthor = parts[0];
    }

    const hasReviewText =
      reviewText &&
      reviewText.trim().length > 0 &&
      reviewText.trim().toLowerCase() !== "no text provided, only a star rating.";

    const greetingExample = cleanAuthor
      ? `(e.g., "Hi ${cleanAuthor}," or "Thank you, ${cleanAuthor}!")`
      : '(e.g., "Thank you for sharing your feedback,")';

    let reviewTypeInstructions = "";
    if (!hasReviewText) {
      reviewTypeInstructions = `   - STAR-ONLY REVIEW (NO WRITTEN TEXT):
     The patient rated ${rating} stars without writing a comment.
     DO NOT invent, assume, or hallucinate specific medical procedures, consultations, or conditions they didn't mention.
     Keep your reply brief (1-2 sentences maximum):
     Express sincere thanks for their ${rating}-star rating and wish them good health and well-being.
     Sign off warmly as the team at ${clinicName}.`;
    } else if (rating >= 4) {
      reviewTypeInstructions = `   - POSITIVE REVIEW (4-5 STARS):
     - Sincerely thank them for taking the time to share their feedback.
     - Specifically acknowledge what they praised (e.g. if they mentioned doctor's patience, staff friendliness, clinic cleanliness, or quick relief).
     - Keep it concise, genuine, and warm (2-3 sentences).
     - Conclude with a thoughtful health wish and sign-off (e.g., "Wishing you good health ahead - Team ${clinicName}").`;
    } else {
      reviewTypeInstructions = `   - CRITICAL / DISSATISFIED REVIEW (1-3 STARS):
     - Be deeply respectful, humble, and empathetic. NEVER argue, make excuses, or sound defensive or legalistic.
     - Validate that any wait, miscommunication, or discomfort is frustrating and falls short of the care your team aims to provide.
     - Invite them to connect directly with the clinic desk or practice manager offline so their concerns can be understood and addressed properly.
     - Keep it short, dignified, and supportive (2-3 sentences).`;
    }

    // 2. Construct Grounded, Human-Centered Prompt
    const prompt = `You are a warm, attentive member of the clinic care team (such as the practice manager or front-desk care coordinator) at "${clinicName}".
${doctorName ? `You work alongside ${doctorName}${specialty ? ` (${specialty})` : ""}.` : ""}
${city ? `Location: ${city}.` : ""}

Task: Write a sincere, natural, and human reply to this Google Business Profile review.

REVIEW DETAILS:
- Patient Name: ${cleanAuthor || "Anonymous"}
- Star Rating: ${rating} out of 5 Stars
- Review Content: "${hasReviewText ? reviewText : "[The patient gave a star rating with no written review text]"}"

${allKeywords.length > 0 ? `RELEVANT PRACTICE SEARCH CONCEPTS (Optional, only if natural): ${allKeywords.slice(0, 3).join(", ")}` : ""}
${instructions ? `DOCTOR'S CUSTOM INSTRUCTIONS: ${instructions}` : ""}

CRITICAL RULES FOR WRITING LIKE A REAL HUMAN CLINIC STAFF MEMBER:
1. STRICT ANTI-ROBOTIC WORD BAN:
   NEVER use generic corporate AI buzzwords. Specifically, DO NOT USE ANY OF THESE WORDS:
   - "thrilled"
   - "delighted"
   - "excited"
   - "overjoyed"
   - "testament"
   - "beacon"
   - "unwavering commitment"
   - "strive for excellence"
   - "utmost priority"
   - "exceptional healthcare journey"
   - "game-changer"
   - "rest assured"
   - "kudos"
   - "in conclusion"

2. NATURAL CONVERSATIONAL TONE:
   - Sound like a real, caring person on the clinic desk writing a quick, sincere message.
   - Address the patient warmly ${greetingExample}.
   - Vary your opening sentence naturally. Do not use the exact same cookie-cutter intro.

3. CONTEXTUAL LOGIC BASED ON REVIEW TYPE:
${reviewTypeInstructions}

4. KEYWORD POLICY:
   - If a target search concept is provided, you may incorporate AT MOST ONE naturally if it flows effortlessly in conversation.
   - If it feels awkward, forced, or sales-like, DO NOT use it. Patient warmth and natural human phrasing ALWAYS take priority.

5. OUTPUT FORMAT:
   - Respond ONLY with the text of the reply.
   - STRICTLY PLAIN TEXT: No quotes, no markdown bolding (**), no asterisks, no code blocks.
   - Provide a complete response with a proper closing sign-off.`;

    // 3. Execute AI Generation with Fallback
    const result = await AIService.generate(
      doctorId,
      AIFeature.REVIEW_REPLY,
      prompt,
      { temperature: 0.75, maxTokens: 400 }
    );

    // 4. Sanitize and Polish Output
    let cleanReply = (result.content || "").trim();
    cleanReply = cleanReply
      .replace(/^```[a-zA-Z]*\n?/g, "")
      .replace(/\n?```$/g, "")
      .replace(/^["']+|["']+$/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/[ \t]+/g, " ")
      .trim();

    return {
      reply: cleanReply,
      creditsUsed: result.creditsUsed,
      remainingCredits: result.remainingCredits,
    };
  }
}