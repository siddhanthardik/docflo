import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { memoryCache } from "@/lib/memory-cache";

// Initialize Gemini (Ensure GEMINI_API_KEY is in .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fallback Model Cascade: Ensures 100% uptime even if a specific model tier experiences high demand (503)
const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      if (response.text?.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[AIAgentsService] Model ${modelName} failed (${err.message}). Trying next fallback...`);
    }
  }
  throw lastError || new Error("All Gemini models unavailable");
}

export class AIAgentsService {
  /**
   * 1. WHATSAPP AI BOOKING ASSISTANT
   * Professional Receptionist & Patient Coordinator for Clinic
   */
  static async runAppointmentAgent(
    doctorId: string,
    incomingMessage: string,
    conversationHistory: string[],
    config: any,
    clinicPhone?: string,
    doctorProfile?: { doctorName?: string; clinicName?: string; specialty?: string }
  ) {
    try {
      const mode = config?.mode || "handoff";
      const tone = config?.tone || "warm_receptionist";
      const customRules = config?.trainingPrompt || config?.customRules || "";
      const emergencyTriggers = config?.emergencyTriggers || "severe pain, bleeding, chest pain, trauma, emergency";
      
      const doctorName = doctorProfile?.doctorName || config?.doctorName || "the Doctor";
      const clinicName = doctorProfile?.clinicName || config?.clinicName || "our Clinic";
      const specialty = doctorProfile?.specialty || config?.specialty || "Medical Specialist";

      // OPD Schedule Configuration
      const morningOpd = config?.morningOpdHours || config?.morningOpd || "";
      const eveningOpd = config?.eveningOpdHours || config?.eveningOpd || "";
      const sundayRule = config?.sundayRule || "Closed";
      const clinicTimings = config?.clinicTimings || [
        morningOpd ? `Morning OPD: ${morningOpd}` : "",
        eveningOpd ? `Evening OPD: ${eveningOpd}` : "",
        `Sunday: ${sundayRule}`
      ].filter(Boolean).join(" | ") || "Mon-Sat: 10:00 AM - 1:30 PM & 5:00 PM - 8:30 PM";

      // Fees & Policy Configuration
      const consultationFee = config?.consultationFee || "";
      const followUpFee = config?.followUpFee || "";
      const followUpDays = config?.followUpDays || "7 days";
      const advanceBookingNotice = config?.advanceBookingNotice || "Same day booking allowed";
      
      // Services & Vaccination List
      const vaccinationsList = config?.vaccinationsList || "BCG, Polio, Hepatitis B, DTP, Rotavirus, MMR, Flu Shot";
      const servicesOffered = config?.servicesOffered || "General OPD Consultation, Health Checkup";

      // Persona & Language
      const assistantName = config?.assistantName || "Riya";

      const isPediatrician = /pediatr|paediatr|child|baby|bal/i.test(specialty) || /pediatr|paediatr|child/i.test(customRules);

      const phoneDisclaimer = clinicPhone && clinicPhone.trim().length > 3
        ? `(I am the clinic's AI assistant. To speak with human please call directly on ${clinicPhone.trim()})`
        : `(I am the clinic's AI assistant. To speak with human staff, please call the clinic directly)`;

      // Emergency Trigger Check
      const lowerMsg = incomingMessage.toLowerCase();
      const triggers = emergencyTriggers.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      const isEmergency = triggers.some((t: string) => lowerMsg.includes(t));

      if (isEmergency) {
        return `⚠️ *Emergency Alert*: If you are experiencing a medical emergency, severe bleeding, or chest pain, please call emergency services immediately or visit the nearest emergency room.\n\n${phoneDisclaimer}`;
      }

      const systemPrompt = `
You are ${assistantName}, the warm, polite, highly experienced Senior WhatsApp Clinic Receptionist for ${clinicName} (${doctorName} - ${specialty}).

CLINIC OPD & SCHEDULE SPECIFICATIONS:
- Doctor: ${doctorName}
- Specialty: ${specialty}
- Clinic Name: ${clinicName}
- Morning OPD Hours: ${morningOpd || "Check Full Schedule"}
- Evening OPD Hours: ${eveningOpd || "Check Full Schedule"}
- Full Schedule Summary: ${clinicTimings}
- Sunday Policy: ${sundayRule}

FEES & POLICY:
- Consultation Fee: ${consultationFee || "Shared at clinic"}
${followUpFee ? `- Follow-up Fee: ${followUpFee} (valid within ${followUpDays})` : ""}
- Booking Notice: ${advanceBookingNotice}

SERVICES & VACCINATION:
- Services Offered: ${servicesOffered}
${isPediatrician ? `- Available Pediatric Vaccinations: ${vaccinationsList}` : ""}
${customRules ? `- Doctor Custom Instructions: "${customRules}"` : ""}

CRITICAL RECEPTONIST INSTRUCTIONS (STRICTLY ENFORCED):
1. **GREETING & INTRODUCTION**:
   - For the FIRST message to a patient, briefly introduce yourself using your name (e.g. "Namaste/Hello! I am ${assistantName}, the AI receptionist at ${clinicName}"). Do not repeat your name in subsequent messages.

2. **HANDLE PATIENT SYMPTOMS & HEALTH QUESTIONS (e.g. "I have fever what should I do?")**:
   - If the patient describes symptoms (fever, cough, pain, stomach ache, rash):
     * Acknowledge warmly and empathetically.
     * State that as a receptionist, you recommend an in-person OPD consultation with Dr. ${doctorName} for proper diagnosis.
     * Check OPD timings (${clinicTimings}) and offer an immediate OPD consultation slot for today or tomorrow!

3. **CHECK OPD TIMINGS BEFORE OFFERING SLOTS**:
   - BEFORE offering morning or evening slots to a patient, YOU MUST CHECK the doctor's actual OPD hours.
   - IF Morning OPD is NOT available (e.g. morning OPD is closed/not configured), DO NOT OFFER MORNING SLOTS. Inform the patient politely: "Dr. ${doctorName} is available for clinic OPD in the Evening from ${eveningOpd || clinicTimings}. Would you like to reserve an evening slot for today or tomorrow?"
   - IF Evening OPD is NOT available, offer Morning slots ONLY.
   - IF both Morning & Evening OPD are open, offer both!

4. **AUTOMATIC LANGUAGE MATCHING (ENGLISH / HINGLISH / HINDI / AUTO)**:
   - AUTOMATICALLY DETECT AND ADAPT TO THE PATIENT'S INPUT LANGUAGE:
     * If the patient writes in Hinglish (mix of Hindi & English e.g. "appointment chahiye", "kal aana hai", "fees kitni hai"), respond in warm, natural Hinglish using polite terms like "Ji", "Namaste", "Ji bilkul".
     * If the patient writes in Hindi ("मुझे अपॉइंटमेंट चाहिए"), respond in polite Hindi.
     * If the patient writes in English, respond in warm, polite English.

5. **APPOINTMENT BOOKING FLOW**:
   - When patient requests to book an appointment or replies YES (e.g. "need appointment", "Yes", "want to visit tomorrow", "is slot available", "Namaste"):
     * Check OPD timings first as instructed above.
     * Ask day and time preference according to available OPD shifts.
   - Once they select a day/time window, ask for their Full Name to reserve the slot.

6. **STRICT VACCINATION RULE**:
   - IF the patient asks about vaccinations ("is vaccine available", "vaccination", "flu shot"):
     * IF this clinic is a Pediatrician / Child Care Clinic (${isPediatrician ? "YES" : "NO"}):
       Confirm vaccination availability during OPD hours (${clinicTimings}). List vaccines if asked (${vaccinationsList}) and invite them to schedule a vaccination visit.
     * IF this clinic is NOT a Pediatrician (e.g. Dermatologist, Gynecologist, Orthopedic, Dental):
       State politely: "Our clinic specializes in ${specialty} and does not offer pediatric vaccinations. We recommend consulting a pediatrician for child vaccines."

7. **TONE & FORMATTING**:
   - Keep responses to 2 to 4 crisp WhatsApp sentences max.
   - Use clean formatting (*bold* key details).
   - NEVER output robotic template text like "We have received your message and a staff member will get back to you".
      `;

      const prompt = `
System Instructions:
${systemPrompt}

Conversation History:
${conversationHistory.join("\n")}

Patient's New Message: "${incomingMessage}"

Write your direct, crisp, professional WhatsApp reply to the patient:
      `;

      let aiReply = await generateWithFallback(prompt);

      // Clean up legacy disclaimers
      aiReply = aiReply
        .replace(/\(I am the clinic's AI assistant.*?\)/gi, "")
        .replace(/Our consultations are 30 minutes in duration\.?/gi, "")
        .replace(/30-minute consultation/gi, "consultation")
        .trim();

      aiReply += `\n\n${phoneDisclaimer}`;

      return aiReply;
    } catch (error: any) {
      console.error("Error in Appointment Agent:", error?.message || error);
      const fallbackPhoneDisclaimer = clinicPhone && clinicPhone.trim().length > 3
        ? `(I am the clinic's AI assistant. To speak with human please call directly on ${clinicPhone.trim()})`
        : `(I am the clinic's AI assistant. To speak with human staff, please call the clinic directly)`;
      return `Hello! Thank you for reaching out to our clinic. I am here to assist you with booking an appointment or answering any clinic questions. Would you like to schedule a visit today or tomorrow?\n\n${fallbackPhoneDisclaimer}`;
    }
  }

  /**
   * 2. REVIEW MANAGER AGENT
   */
  static async runReviewAgent(reviewText: string, rating: number, config: any) {
    try {
      const instructions = config?.instructions || "Always thank the patient by name, mention clinic, and invite negative reviewers to contact us privately.";
      const targetKeywords = config?.targetKeywords || "Root Canal, Laser Treatment, Pediatric Care";
      
      const prompt = `
        You are an elite Reputation Management Specialist replying to a Google Business Review on behalf of the clinic owner using Gemini API.
        
        Review Rating: ${rating} Stars
        Review Text: "${reviewText}"
        
        Custom Guidelines: ${instructions}
        Target Keywords to Weave In Naturally (if relevant): ${targetKeywords}
        
        Respond ONLY with the exact text of the reply. No markdown quotes or extra filler.
      `;

      return await generateWithFallback(prompt);
    } catch (error) {
      console.error("Error in Review Agent:", error);
      return "Thank you for your review and feedback.";
    }
  }

  /**
   * 3. PROFILE UPDATER AGENT
   */
  static async runProfileAgent(config: any) {
    try {
      const focusAreas = config?.focusAreas || "General Care, Preventive Health, Clinic Updates";
      const brandVoice = config?.brandVoice || "Informative healthcare tone, max 2 emojis, end with booking phone number.";
      const ctaType = config?.ctaType || "LEARN_MORE";
      
      const prompt = `
        You are a Google Business Profile Content Strategist.
        Create an engaging GBP Update Post for a healthcare clinic.
        Focus Areas: ${focusAreas}
        Brand Voice: ${brandVoice}
        CTA Button: ${ctaType}
        
        Output JSON format only:
        {
          "title": "Short Catchy Post Headline",
          "content": "Full post content body (100-150 words)",
          "postType": "STANDARD",
          "ctaType": "${ctaType}"
        }
      `;

      const text = await generateWithFallback(prompt);
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {}

      return {
        title: "Schedule Your Regular Health Checkup",
        content: "Stay proactive about your health! Visit our clinic for comprehensive health checkups and personalized care. Book your appointment today.",
        postType: "STANDARD",
        ctaType: ctaType || "LEARN_MORE"
      };
    } catch (error) {
      console.error("Error in Profile Agent:", error);
      return {
        title: "Health & Wellness Consultation",
        content: "Schedule your consultation with our specialist doctors today.",
        postType: "STANDARD",
        ctaType: "LEARN_MORE"
      };
    }
  }

  /**
   * 4. LOCAL SEO COPILOT AGENT
   */
  static async runLocalSeoCopilot(doctorIdOrOptions: any, config?: any) {
    try {
      const keywords = config?.keywords || "Best Clinic, Doctor Near Me";
      const focus = config?.focus || "all";

      const prompt = `
        You are a Local SEO Copilot.
        Analyze target keywords: ${keywords} (Focus Priority: ${focus}).
        Provide 3 prioritized action items to improve local Google Maps rank.
        Return JSON array format: [{"title": "Action Title", "impact": "HIGH", "description": "Action details"}]
      `;

      const text = await generateWithFallback(prompt);
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {}

      return [
        { title: "Optimize GBP Business Title", impact: "HIGH", description: "Add main specialty and location to GBP business title." },
        { title: "Increase Weekly Review Velocity", impact: "HIGH", description: "Send automated WhatsApp review requests to recent patients." },
        { title: "Publish Weekly Google Updates", impact: "MEDIUM", description: "Post weekly posts highlighting key clinic treatments." }
      ];
    } catch (error) {
      console.error("Error in Local SEO Copilot Agent:", error);
      return [];
    }
  }
}
