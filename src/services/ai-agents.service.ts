import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { memoryCache } from "@/lib/memory-cache";

// Initialize Gemini (Ensure GEMINI_API_KEY is in .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fallback Model Cascade: Ensures maximum uptime across latest Gemini releases
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.5-flash"
];

function buildDeterministicReceptionistReply(
  incomingMessage: string,
  doctorName: string,
  clinicName: string,
  specialty: string,
  clinicTimings: string,
  consultationFee: string,
  servicesOffered: string,
  assistantName: string,
  clinicAddress?: string | null,
  clinicMapsUri?: string | null,
  clinicPhone?: string
): string {
  const textLower = incomingMessage.trim().toLowerCase();
  const phoneDisclaimer = clinicPhone && clinicPhone.trim().length > 3
    ? `(I am the clinic's AI assistant. To speak with human please call directly on ${clinicPhone.trim()})`
    : `(I am the clinic's AI assistant. To speak with human staff, please call the clinic directly)`;

  // 1. Greetings (Hi, Hello, Hey, Namaste, Good morning/evening, etc.)
  if (/^(hi|hello|hey|namaste|pranam|good\s*(morning|afternoon|evening)|hola|hii+|hl|hlo|helo)\b/i.test(textLower) || textLower === "hi" || textLower === "hello" || textLower === "hl" || textLower === "hii") {
    return `Hello! Namaste 🙏 I am ${assistantName}, receptionist at *${clinicName}* (Dr. ${doctorName} · ${specialty}).\n\nHow may I help you with an appointment or clinic inquiry today?\n\n${phoneDisclaimer}`;
  }

  // 2. Appointment Booking / Schedule
  if (/appointment|book|visit|consult|slot|schedule|timing|available|doctor|kal|aana|milna|today|tomorrow/i.test(textLower)) {
    return `Dr. ${doctorName} is available for clinic consultations during OPD hours:\n🕒 *${clinicTimings}*\n\nWould you like to schedule an appointment for *today* or *tomorrow*? Please reply with your preferred date, time, and patient name.\n\n${phoneDisclaimer}`;
  }

  // 3. Fee / Price Inquiry
  if (/fee|charge|cost|price|kitna|rupee|paisa|rate/i.test(textLower)) {
    const feeText = consultationFee ? `Consultation fee is *₹${consultationFee.replace(/\D/g, '') || consultationFee}*` : "Consultation fee details are shared directly at the clinic during your visit";
    return `${feeText} for Dr. ${doctorName} (${specialty}).\n\nWould you like to reserve a consultation slot for today or tomorrow?\n\n${phoneDisclaimer}`;
  }

  // 4. Address / Location / Directions
  if (/address|location|kahan|where|directions|map|clinic\s*kaha/i.test(textLower)) {
    if (clinicAddress) {
      return `Our clinic address is:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nDr. ${doctorName} is available during OPD hours (${clinicTimings}).\n\n${phoneDisclaimer}`;
    }
    return `Our clinic is located at *${clinicName}*. For exact street directions or landmark guidance, please call *${clinicPhone || "the clinic"}* directly.\n\n${phoneDisclaimer}`;
  }

  // 5. Symptom / Health / Treatment inquiry
  if (/fever|cough|pain|cold|vomit|headache|fracture|knee|baby|child|skin|teeth|allergy|injury|treatment/i.test(textLower)) {
    return `Thank you for sharing your concern. For proper medical diagnosis and care, we recommend an in-person consultation with Dr. ${doctorName} (${specialty}).\n\nOPD Timings: *${clinicTimings}*\nWould you like to book a slot for today or tomorrow?\n\n${phoneDisclaimer}`;
  }

  // 6. Default Fallback
  return `Hello! Thank you for reaching out to *${clinicName}*. I am ${assistantName}, here to assist you with booking an appointment with Dr. ${doctorName} (${specialty}) or answering any clinic questions.\n\nWould you like to schedule an in-clinic visit today or tomorrow?\n\n${phoneDisclaimer}`;
}

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
      const errText = err.message || err.toString() || "";
      console.warn(`[AIAgentsService] Model ${modelName} failed (${errText}). Downgrading to next candidate...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
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
    doctorProfile?: { doctorName?: string; clinicName?: string; specialty?: string },
    clinicAddress?: string | null,
    clinicMapsUri?: string | null
  ) {
    try {
      const mode = config?.mode || "handoff";
      const tone = config?.tone || "warm_receptionist";
      const customRules = config?.trainingPrompt || config?.customRules || "";
      const emergencyTriggers = config?.emergencyTriggers || "severe pain, bleeding, chest pain, trauma, emergency";
      
      const doctorName = doctorProfile?.doctorName || config?.doctorName || "Doctor";
      const clinicName = doctorProfile?.clinicName || config?.clinicName || (doctorName !== "Doctor" ? `${doctorName}'s Clinic` : "our Clinic");
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

      const currentDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      // Clinic Location (sourced from connected GMB/GBP profile — never hardcoded)
      const locationBlock = clinicAddress
        ? `- Clinic Address: ${clinicAddress}${clinicMapsUri ? `\n- Google Maps Link: ${clinicMapsUri}` : ''}`
        : null;

      const systemPrompt = `
You are ${assistantName}, the warm, polite, highly experienced Senior WhatsApp Clinic Receptionist for ${clinicName} (${doctorName} - ${specialty}).

TODAY'S DATE: ${currentDateStr} (Indian Standard Time)

CLINIC OPD & SCHEDULE SPECIFICATIONS:
- Doctor: ${doctorName}
- Specialty: ${specialty}
- Clinic Name: ${clinicName}
- Morning OPD Hours: ${morningOpd || "Check Full Schedule"}
- Evening OPD Hours: ${eveningOpd || "Check Full Schedule"}
- Full Schedule Summary: ${clinicTimings}
- Sunday Policy: ${sundayRule}
${locationBlock ? locationBlock : ""}

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
   - Introduce yourself as ${assistantName}, receptionist at ${clinicName} on the FIRST greeting. In active back-and-forth conversations, keep your tone natural without re-introducing yourself.

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
   - When patient requests to book an appointment or replies YES (e.g. "need appointment", "Yes", "want to visit tomorrow", "is slot available"):
     * Check OPD timings first as instructed above.
     * Ask for their preferred Date and Session (Morning or Evening).
   - Once they select a Date, Session, and provide their Full Name to reserve the slot, you MUST confirm the booking.
   - When confirming the booking, you MUST append this exact secret tag at the very end of your message: [BOOK_APPOINTMENT: YYYY-MM-DD, Session, Patient Full Name]
   - Example tag: [BOOK_APPOINTMENT: 2026-08-05, Morning, Rahul Kumar]

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

8. **STRICT ANTI-HALLUCINATION & SAFETY RULE**:
   - You MUST NOT invent, guess, or hallucinate any clinic services, prices, medical advice, doctor availability, or policies that are not explicitly provided in this system prompt. 
   - DO NOT give medical advice or diagnose patients under any circumstances.
   - If a patient asks a question you do not know the answer to (or if the information is missing from the config), politely state that you do not have that information and invite them to call the clinic directly to speak with human staff.

9. **CLINIC LOCATION & DIRECTIONS**:
${locationBlock
  ? `   - When a patient asks for the clinic address, location, or how to reach the clinic, share the following:
     Address: *${clinicAddress}*${clinicMapsUri ? `\n     Google Maps: ${clinicMapsUri}` : ''}
   - Always include the Maps link so patients can navigate directly.
   - NEVER say "I don't have the address" — you have the full address above. Use it.`
  : `   - If a patient asks for the clinic address or directions, let them know warmly that our team is still updating location details on the system, and invite them to call *${clinicPhone || 'the clinic'}* directly for the exact address and directions.`
}
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

      // Smart disclaimer logic: Only append on initial greeting or when patient explicitly asks for phone/contact/human
      const hasAlreadyGreeted = conversationHistory.some(msg => msg.startsWith("Clinic:"));
      const wantsContact = /human|speak|call|phone|number|contact|talk/i.test(incomingMessage);

      if (!hasAlreadyGreeted || wantsContact) {
        aiReply += `\n\n${phoneDisclaimer}`;
      }

      return aiReply;
    } catch (error: any) {
      console.error("[AIAgentsService] LLM generation error in Appointment Agent, using intelligent receptionist fallback:", error?.message || error);
      
      const doctorName = doctorProfile?.doctorName || config?.doctorName || "Doctor";
      const clinicName = doctorProfile?.clinicName || config?.clinicName || (doctorName !== "Doctor" ? `${doctorName}'s Clinic` : "our Clinic");
      const specialty = doctorProfile?.specialty || config?.specialty || "Medical Specialist";
      const morningOpd = config?.morningOpdHours || config?.morningOpd || "";
      const eveningOpd = config?.eveningOpdHours || config?.eveningOpd || "";
      const sundayRule = config?.sundayRule || "Closed";
      const clinicTimings = config?.clinicTimings || [
        morningOpd ? `Morning OPD: ${morningOpd}` : "",
        eveningOpd ? `Evening OPD: ${eveningOpd}` : "",
        `Sunday: ${sundayRule}`
      ].filter(Boolean).join(" | ") || "Mon-Sat: 10:00 AM - 1:30 PM & 5:00 PM - 8:30 PM";
      const consultationFee = config?.consultationFee || "";
      const servicesOffered = config?.servicesOffered || "General OPD Consultation, Health Checkup";
      const assistantName = config?.assistantName || "Riya";

      return buildDeterministicReceptionistReply(
        incomingMessage,
        doctorName,
        clinicName,
        specialty,
        clinicTimings,
        consultationFee,
        servicesOffered,
        assistantName,
        clinicAddress,
        clinicMapsUri,
        clinicPhone
      );
    }
  }

  /**
   * 1.5. WHATSAPP INTERNAL STAFF ASSISTANT
   * Personal AI Assistant for the Clinic Doctor & Staff
   */
  static async runStaffAssistantAgent(
    doctorId: string,
    incomingMessage: string,
    conversationHistory: string[],
    appointments: any[],
    doctorProfile?: { doctorName?: string }
  ) {
    try {
      const doctorName = doctorProfile?.doctorName || "Doctor";
      
      // Format the schedule context for the AI
      const scheduleLines = appointments.map(apt => {
        const timeStr = new Date(apt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const patientName = apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : "Unknown Patient";
        const patientPhone = apt.patient?.phone || "N/A";
        return `- [ID: ${apt.id}] ${dateStr} at ${timeStr} | ${patientName} (Phone: ${patientPhone}) | Status: ${apt.status}`;
      });

      const currentDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const scheduleContext = scheduleLines.length > 0 
        ? scheduleLines.join("\n") 
        : "There are no appointments scheduled in the fetched timeframe.";

      const systemPrompt = `
You are the highly professional, warm, and polite Internal AI Receptionist for ${doctorName} and their clinic.
You are communicating directly with the Doctor/Staff on WhatsApp. Your persona must be warm and highly respectful to the doctor. Always greet the doctor warmly by name (e.g., "Good morning Dr. ${doctorName}," or "Hello Doctor,"). Treat them with the utmost professional respect as if you were a human receptionist sitting at the front desk. 

TODAY'S DATE: ${currentDateStr} (Indian Standard Time)

Here is the clinic schedule for the Upcoming Week:
<SCHEDULE>
${scheduleContext}
</SCHEDULE>

INSTRUCTIONS:
1. **Always Greet**: Start your responses with a polite greeting acknowledging the doctor.
2. **Answer Accurately**: Answer the doctor's questions about the schedule accurately based ONLY on the provided <SCHEDULE>. If they ask for "tomorrow", look at TODAY'S DATE and check the schedule for the correct day.
3. **Be Helpful & Natural**: Do not sound robotic or blunt. Say things like "Right away, Doctor" or "Here is your schedule for tomorrow."
4. **CANCELLATIONS**: If the doctor asks you to cancel a specific appointment, politely confirm the cancellation in your text and you MUST append this exact technical tag at the very end of your message: \`[CANCEL_APPOINTMENT: ID]\` where ID is the exact ID of the appointment.
5. **RESCHEDULING**: If the doctor asks you to reschedule a specific appointment to a new date/session, you MUST append this exact technical tag at the very end of your message: \`[RESCHEDULE_APPOINTMENT: ID, YYYY-MM-DD, Session]\` where Session is "Morning" or "Evening".
6. **MESSAGING PATIENTS**: If the doctor asks you to relay a message to a patient, ask them a question, or see if they can reschedule (e.g. "Ask Samriddhi if she can come on Friday"), you MUST append this exact technical tag at the very end of your message: \`[MESSAGE_PATIENT: Phone_Number, Your_Message_Text]\`. Use the patient's Phone number from the schedule above. Write the message professionally as the clinic receptionist acting on behalf of the doctor.
7. **BOOKING NEW APPOINTMENTS**: If the doctor asks you to book an appointment for a patient by name and date/time, you MUST append this exact technical tag at the very end of your message: \`[BOOK_NEW_APPOINTMENT: Full_Patient_Name, YYYY-MM-DD, HH:MM AM/PM]\`. If the doctor also provides a phone number in their message, include it as a 4th parameter: \`[BOOK_NEW_APPOINTMENT: Full_Patient_Name, YYYY-MM-DD, HH:MM AM/PM, Phone_Number]\`. For example, if the doctor says "Book for Saroj Kumari Mobile Number +917979854719 for 5 Aug 7 PM", the tag should be: \`[BOOK_NEW_APPOINTMENT: Saroj Kumari, 2026-08-05, 7:00 PM, 917979854719]\`. The system will automatically create the patient profile, book the slot, and send a WhatsApp confirmation. Your text response should warmly acknowledge the booking.
8. Only use the technical tags when explicitly needed based on the doctor's instructions.
      `;

      const prompt = `
System Instructions:
${systemPrompt}

Conversation History:
${conversationHistory.join("\n")}

Staff's New Message: "${incomingMessage}"

Write your direct, crisp WhatsApp reply to the staff member:
      `;

      const aiReply = await generateWithFallback(prompt);
      return aiReply.trim();
    } catch (error: any) {
      console.error("Error in Staff Assistant Agent:", error?.message || error);
      return "I'm sorry Doctor, I am currently experiencing a technical issue and cannot access the schedule right now. Please check the dashboard directly.";
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
