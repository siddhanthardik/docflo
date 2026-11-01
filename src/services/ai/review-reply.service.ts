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
    const toneStyle = savedConfig.toneStyle || "warm";
    const signOffFormat = savedConfig.signOffFormat || "team_clinic";
    const resolutionContact = (savedConfig.resolutionContact || "").trim();
    
    // Combine explicit keywords with saved keywords
    const savedKeywords = savedConfig.targetKeywords
      ? savedConfig.targetKeywords.split(",").map((k: string) => k.trim())
      : [];
    const allKeywords = Array.from(new Set([...(keywords || []), ...savedKeywords])).filter(
      Boolean
    );

    // Format sign-off preference
    let signOffGuideline = `Team ${clinicName}`;
    if (signOffFormat === "manager_team") {
      signOffGuideline = `Practice Manager & Care Team, ${clinicName}`;
    } else if (signOffFormat === "doctor_team" && doctorName) {
      signOffGuideline = `${doctorName} & the Team at ${clinicName}`;
    } else if (signOffFormat === "care_coordinator") {
      signOffGuideline = `Patient Care Coordinator, ${clinicName}`;
    }

    // Format tone guideline
    let toneGuideline = "Warm, attentive, and polite medical care coordinator tone.";
    if (toneStyle === "professional") {
      toneGuideline = "Polite, dignified, and professional healthcare clinic tone.";
    } else if (toneStyle === "friendly_family") {
      toneGuideline = "Friendly, neighborly, and deeply reassuring family-clinic tone.";
    } else if (toneStyle === "concise") {
      toneGuideline = "Concise, respectful, and direct clinic response (1-2 sentences).";
    }

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
     Sign off warmly as "${signOffGuideline}".`;
    } else if (rating >= 4) {
      reviewTypeInstructions = `   - POSITIVE REVIEW (4-5 STARS):
     - Sincerely thank them for taking the time to share their feedback.
     - Specifically acknowledge what they praised (e.g. if they mentioned doctor's patience, staff friendliness, clinic cleanliness, or quick relief).
     - Keep it concise, genuine, and warm (2-3 sentences).
     - Conclude with a thoughtful health wish and sign-off as "${signOffGuideline}".`;
    } else {
      reviewTypeInstructions = `   - CRITICAL / DISSATISFIED REVIEW (1-3 STARS):
     - Be deeply respectful, humble, and empathetic. NEVER argue, make excuses, or sound defensive or legalistic.
     - Validate that any wait, miscommunication, or discomfort is frustrating and falls short of the care your team aims to provide.
     - Invite them to connect directly offline so their concerns can be understood and addressed properly.${
       resolutionContact
         ? ` Provide our clinic contact: "${resolutionContact}".`
         : " Invite them to speak with our clinic desk or practice manager directly."
     }
     - Keep it short, dignified, and supportive (2-3 sentences).
     - Sign off as "${signOffGuideline}".`;
    }

    // 2. Construct Grounded, Human-Centered Prompt
    const prompt = `You are a member of the clinic care team (such as the practice manager or front-desk care coordinator) at "${clinicName}".
${doctorName ? `You work alongside ${doctorName}${specialty ? ` (${specialty})` : ""}.` : ""}
${city ? `Location: ${city}.` : ""}

Task: Write a sincere, natural, and human reply to this Google Business Profile review.

PREFERRED CLINIC TONE: ${toneGuideline}
PREFERRED SIGN-OFF: "${signOffGuideline}"

REVIEW DETAILS:
- Patient Name: ${cleanAuthor || "Anonymous"}
- Star Rating: ${rating} out of 5 Stars
- Review Content: "${hasReviewText ? reviewText : "[The patient gave a star rating with no written review text]"}"

${allKeywords.length > 0 ? `TARGET LOCAL SEARCH TERM / SEO FOCUS: "${allKeywords[0]}"${allKeywords.length > 1 ? ` (Secondary concepts: ${allKeywords.slice(1, 3).join(", ")})` : ""}` : ""}
${instructions ? `DOCTOR'S CUSTOM INSTRUCTIONS: ${instructions}` : ""}

CRITICAL RULES FOR WRITING LIKE A REAL HUMAN CLINIC STAFF MEMBER:
1. STRICT ANTI-ROBOTIC & ANTI-MARKETING BANNED PHRASES:
   NEVER use corporate AI clichés, commercial sales words, or melodramatic filler. Specifically, DO NOT USE ANY OF THESE:
   - Commercial / Spam words: "great deal", "best deal", "deal", "five-star experience", "top-rated", "top-notch", "value for money"
   - Melodramatic / AI filler: "means a great deal", "means the world", "words cannot express", "words like yours truly encourage", "words like yours encourage", "deeply touched", "truly humbled", "truly honored", "heartwarming"
   - Corporate medical buzzwords: "unwavering commitment", "strive for excellence", "utmost priority", "exceptional healthcare journey", "healthcare journey", "beacon of hope", "testament", "game-changer", "rest assured", "kudos", "thrilled", "delighted", "overjoyed", "excited", "in conclusion"

2. HUMBLE & NATURAL CLINIC VOICE (NO SELF-BOASTING):
   - Sound like a real, polite healthcare receptionist or practice manager writing a warm, 2-to-3 sentence note.
   - Address the patient warmly ${greetingExample}.
   - NEVER boast or self-proclaim (e.g. NEVER write "care expected from the best nephrologist in Patna" or "proves why we are the best").
   - Instead, express sincere, humble dedication: e.g. "Dr. Chandra and our team are very glad that your consultation went well. We remain dedicated to providing accessible, trusted kidney care for patients in Patna."

3. CONTEXTUAL LOGIC BASED ON REVIEW TYPE:
${reviewTypeInstructions}

4. LOCAL SEO & TARGET KEYWORD INTEGRATION:
   ${
     allKeywords.length > 0
       ? `- If a search term is specified ("${allKeywords[0]}"), humbly and naturally mention the core specialty and city (e.g., "dedicated to providing trusted nephrology and kidney care in Patna").
   - Blend it organically into the sentence without forced phrasing, self-boasting, or marketing hype.`
       : `- Keep the response warm, natural, and patient-focused.`
   }

5. OUTPUT FORMAT & LENGTH:
   - Keep total length to 2 to 3 concise, genuine sentences plus a warm sign-off.
   - Respond ONLY with the text of the reply.
   - STRICTLY PLAIN TEXT: No quotes, no markdown bolding (**), no asterisks, no code blocks.`;

    // 3. Execute AI Generation with Fallback
    const result = await AIService.generate(
      doctorId,
      AIFeature.REVIEW_REPLY,
      prompt,
      { temperature: 0.75, maxTokens: 1024 }
    );

    // 4. Sanitize and Polish Output (Tier 2 Code-Level Guardrail)
    let cleanReply = (result.content || "").trim();
    cleanReply = cleanReply
      .replace(/^```[a-zA-Z]*\n?/g, "")
      .replace(/\n?```$/g, "")
      .replace(/^["']+|["']+$/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1");

    // Tier 2 Filter: Strip AI emotional clichés & commercial marketing phrases
    cleanReply = cleanReply
      .replace(/\b(?:it\s+)?means\s+a\s+great\s+deal\s+(?:to\s+(?:us|our\s+team|hear|know)\s+)?(?:that\s+)?/gi, "we are very glad that ")
      .replace(/\b(?:it\s+)?means\s+the\s+world\s+(?:to\s+(?:us|our\s+team|hear|know)\s+)?(?:that\s+)?/gi, "we are glad that ")
      .replace(/\bwords\s+like\s+yours\s+(?:truly\s+)?encourage\s+our\s+team\s*(?:as|and)?\s*/gi, "")
      .replace(/\b(?:the\s+)?care\s+expected\s+from\s+(?:the\s+)?best\s+(\w+)\s+in\s+([a-zA-Z\s]+)/gi, "trusted $1 care in $2")
      .replace(/\ba\s+great\s+deal\b/gi, "so much")
      .replace(/\bexceptional\s+healthcare\s+journey\b/gi, "care")
      .replace(/\bhealthcare\s+journey\b/gi, "treatment")
      .replace(/\bunwavering\s+commitment\b/gi, "dedication")
      .replace(/\b\s{2,}\b/g, " ")
      .replace(/\s+\./g, ".")
      .replace(/\.{2,}/g, ".")
      .trim();

    return {
      reply: cleanReply,
      creditsUsed: result.creditsUsed,
      remainingCredits: result.remainingCredits,
    };
  }
}