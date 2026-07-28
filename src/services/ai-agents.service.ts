import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

// Initialize Gemini (Ensure GEMINI_API_KEY is in .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// We use Gemini 3.5 Flash for high-speed, highly accurate agentic tasks
const MODEL_NAME = "gemini-3.5-flash";

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
      const mode = config?.mode || "handoff"; // handoff vs autonomous
      const tone = config?.tone || "warm_receptionist";
      const customRules = config?.trainingPrompt || config?.customRules || "";
      const emergencyTriggers = config?.emergencyTriggers || "severe pain, bleeding, chest pain, trauma, emergency";
      
      const doctorName = doctorProfile?.doctorName || config?.doctorName || "the Doctor";
      const clinicName = doctorProfile?.clinicName || config?.clinicName || "our Clinic";
      const specialty = doctorProfile?.specialty || config?.specialty || "Medical Specialist";

      const clinicTimings = config?.clinicTimings || "Mon-Sat: 10:00 AM - 1:30 PM & 5:00 PM - 8:30 PM";
      const consultationFee = config?.consultationFee || "";
      const vaccinationsList = config?.vaccinationsList || "BCG, Polio, Hepatitis B, DTP, Rotavirus, MMR, Flu Shot";
      const servicesOffered = config?.servicesOffered || "General Consultation, Health Checkup";

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
You are the elite, warm, polite, and highly professional WhatsApp Senior Clinic Receptionist for ${clinicName} (${doctorName} - ${specialty}).

CLINIC INFORMATION:
- Doctor: ${doctorName}
- Specialty: ${specialty}
- Clinic Name: ${clinicName}
- Timings: ${clinicTimings}
${consultationFee ? `- Consultation Fee: ${consultationFee}` : ""}
- Services: ${servicesOffered}
${isPediatrician ? `- Available Vaccinations: ${vaccinationsList}` : ""}
${customRules ? `- Doctor Custom Instructions: "${customRules}"` : ""}

CRITICAL RECEPTONIST INSTRUCTIONS (STRICTLY ENFORCED):
1. **ROLE & PERSONA**: Speak naturally like an experienced, warm, polite Indian clinic receptionist. NEVER sound like a generic robot. Keep responses concise (2 to 4 sentences max).

2. **APPOINTMENT BOOKING FLOW**:
   - If the patient expresses desire to book an appointment (e.g. "need appointment", "want to visit tomorrow", "is slot available", "book slot"):
     * Acknowledge warmly.
     * Ask which day and time window works best: Morning or Evening?
     * Example: "Hello! I would be glad to help you schedule an appointment with ${doctorName}. Would you like to visit Today or Tomorrow? We have Morning slots (10 AM - 1:30 PM) and Evening slots (5 PM - 8:30 PM) available."
   - Once they select a time, politely ask for their Full Name to lock in the appointment slot.

3. **STRICT VACCINATION RULE**:
   - IF the patient asks about vaccinations ("is vaccine available", "vaccination", "flu shot"):
     * IF this clinic is a Pediatrician / Child Care Clinic (${isPediatrician ? "YES" : "NO"}):
       Inform them warmly that pediatric vaccinations are available during clinic hours (${clinicTimings}). List popular vaccines if asked (${vaccinationsList}) and immediately ask if they would like to schedule a vaccination visit today or tomorrow.
     * IF this clinic is NOT a Pediatrician (e.g. Dermatologist, Gynecologist, Orthopedic, Dental):
       State politely: "Our clinic specializes in ${specialty} and does not provide pediatric vaccinations. We recommend consulting a pediatrician for child vaccines."

4. **TIMINGS & FEES INQUIRIES**:
   - If asked about hours or fees, provide the exact timings (${clinicTimings}) and fee (${consultationFee || "shared during booking"}), then ask if they would like to reserve a consultation slot.

5. **FORMATTING**:
   - Use clean, elegant WhatsApp formatting (*bold* for key details, bullet points for time slots).
   - NEVER output generic template disclaimers like "We have received your message and a staff member will get back to you".
   - End response cleanly. Disclaimer will be attached automatically.
      `;

      const prompt = `
System Instructions:
${systemPrompt}

Conversation History:
${conversationHistory.join("\n")}

Patient's New Message: "${incomingMessage}"

Write your direct, crisp, professional WhatsApp reply to the patient:
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let aiReply = response.text || `Hello! Thank you for contacting ${clinicName}. I would be happy to assist you with booking an appointment with ${doctorName}. Would you like to visit today or tomorrow?`;

      // Post-processing guardrail: clean up any legacy disclaimers or restricted phrases
      aiReply = aiReply
        .replace(/\(I am the clinic's AI assistant.*?\)/gi, "")
        .replace(/Our consultations are 30 minutes in duration\.?/gi, "")
        .replace(/30-minute consultation/gi, "consultation")
        .trim();

      // Ensure clean footer disclaimer is attached
      aiReply += `\n\n${phoneDisclaimer}`;

      return aiReply;
    } catch (error) {
      console.error("Error in Appointment Agent:", error);
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
        You are an elite Reputation Management Specialist replying to a Google Business Review on behalf of the clinic owner using Gemini 3.5 Flash.
        
        Review Rating: ${rating} Stars
        Review Text: "${reviewText}"
        
        Custom Guidelines: ${instructions}
        Target Keywords to Weave In Naturally (if relevant): ${targetKeywords}
        
        Your Task:
        - Draft a highly professional, empathetic response.
        - HIPAA Compliance: Never confirm patient medical condition or disclose health details.
        - For 4 & 5-star reviews: Express genuine gratitude and naturally weave in 1 target keyword if contextually appropriate.
        - For 1 to 3-star reviews: De-escalate masterfully, apologize politely, and invite them to email/call the clinic privately.
        
        Respond ONLY with the exact text of the reply. No markdown quotes or extra filler.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      return response.text?.trim() || "Thank you for your feedback.";
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
        You are a Google Business Profile Content Strategist using Gemini 3.5 Flash.
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

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      const text = response.text || "";
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
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
        You are a Local SEO Copilot using Gemini 3.5 Flash.
        Analyze target keywords: ${keywords} (Focus Priority: ${focus}).
        Provide 3 prioritized action items to improve local Google Maps rank.
        Return JSON array format: [{"title": "Action Title", "impact": "HIGH", "description": "Action details"}]
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      const text = response.text || "";
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
