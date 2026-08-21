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

// Clean and format doctor display name without repetitive "Dr." prefixes
export function formatDoctorDisplayName(rawName?: string): string {
  if (!rawName || rawName.trim() === "" || rawName.toLowerCase() === "doctor") {
    return "the Doctor";
  }
  // Strip all leading "Dr.", "Dr", "Doctor", "Dr. Dr" case-insensitively
  let clean = rawName.trim();
  while (/^(dr\.?|doctor)\s+/i.test(clean)) {
    clean = clean.replace(/^(dr\.?|doctor)\s+/i, "").trim();
  }
  return clean ? `Dr. ${clean}` : "the Doctor";
}

function buildDeterministicReceptionistReply(
  incomingMessage: string,
  rawDoctorName: string,
  clinicName: string,
  specialty: string,
  clinicTimings: string,
  consultationFee: string,
  servicesOffered: string,
  assistantName: string,
  clinicAddress?: string | null,
  clinicMapsUri?: string | null,
  clinicPhone?: string,
  isOngoingChat: boolean = false
): string {
  const text = incomingMessage.trim();
  const textLower = text.toLowerCase();
  const docTitle = formatDoctorDisplayName(rawDoctorName);

  // Script & Dialect Detection
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const isTamil = /[\u0B80-\u0BFF]/.test(text);
  const isTelugu = /[\u0C00-\u0C7F]/.test(text);
  const isKannada = /[\u0C80-\u0CFF]/.test(text);
  const isMalayalam = /[\u0D00-\u0D7F]/.test(text);
  const isBengali = /[\u0980-\u09FF]/.test(text);
  const isGujarati = /[\u0A80-\u0AFF]/.test(text);
  const isPunjabi = /[\u0A00-\u0A7F]/.test(text);

  const isHindiOrHinglish = hasDevanagari || /\b(kya|kab|kahan|kaha|kaise|kitna|kitni|chahiye|milna|aana|hai|hain|bhi|ji|hlo|namaste|pranam|batao|bataiye|samay|fees|aaj|aj|kal|parso|late|mushkil|pahuch|pahuchenge|thik|theek|kardo|kar|ho|raha|gya|gaya|time\s*pe)\b/i.test(textLower);

  // User explicitly asking for phone / human call
  const wantsCallOrHuman = /human|speak|call|phone|number|contact|talk|baat|phone\s*number/i.test(textLower);
  const phoneSuffix = (wantsCallOrHuman && clinicPhone && clinicPhone.trim().length > 3)
    ? `\n\n📞 Aap direct clinic reception par *${clinicPhone.trim()}* par bhi call kar sakte hain.`
    : (wantsCallOrHuman && clinicPhone)
    ? `\n\n📞 You can also reach our clinic reception directly at *${clinicPhone.trim()}*.`
    : "";

  const cleanFee = consultationFee ? consultationFee.replace(/[^\d.,]/g, '').trim() : "";

  // ════ 1. SOUTH / EAST / REGIONAL INDIAN SCRIPTS ══════════════════════════
  if (isTamil) {
    if (/நேரம்|டைம்|எப்போது|opd/.test(text)) {
      return `${docTitle} கிளினிக்கில் ஆலோசனைக்கு கிடைக்கும் நேரம்:\n🕒 *${clinicTimings}*\n\nஇன்று அல்லது நாளைக்கு அப்பாயின்ட்மென்ட் முன்பதிவு செய்ய விரும்புகிறீர்களா?${phoneSuffix}`;
    }
    if (/கட்டணம்|பீஸ்|விலை|செலவு/.test(text)) {
      const feeText = cleanFee ? `ஆலோசனைக் கட்டணம் *₹${cleanFee}*` : "ஆலோசனைக் கட்டண விவரங்கள் கிளினிக்கில் தெரிவிக்கப்படும்";
      return `${docTitle} (${specialty}) ${feeText}.\n\nஇன்று அல்லது நாளைக்கு அப்பாயின்ட்மென்ட் முன்பதிவு செய்ய விரும்புகிறீர்களா?${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `சரிங்க! ${docTitle} (${specialty}) சந்திப்பிற்கு இன்று அல்லது நாளைக்கு நேரம் முன்பதிவு செய்ய விரும்புகிறீர்களா? உங்கள் பெயர் மற்றும் நேரத்தைத் தெரிவிக்கவும்.${phoneSuffix}`;
    }
    return `வணக்கம்! 🙏 நான் ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) வரவேற்பாளர்.\n\nஇன்று உங்களுக்கு அப்பாயின்ட்மென்ட் அல்லது கிளினிக் தகவலில் எவ்வாறு உதவ முடியும்?${phoneSuffix}`;
  }

  if (isTelugu) {
    if (/సమయం|టైమింగ్|ఎప్పుడు|opd/.test(text)) {
      return `${docTitle} క్లినిక్‌లో సంప్రదింపులకు అందుబాటులో ఉండే సమయం:\n🕒 *${clinicTimings}*\n\nమీరు ఈరోజు లేదా రేపటికి అపాయింట్‌మెంట్ బుక్ చేయాలనుకుంటున్నారా?${phoneSuffix}`;
    }
    if (/ఫీజు|ఖర్చు|ధర/.test(text)) {
      const feeText = cleanFee ? `కన్సల్టేషన్ ఫీజు *₹${cleanFee}*` : "ఫీజు వివరాలు క్లినిక్‌లో తెలియజేయబడతాయి";
      return `${docTitle} (${specialty}) ${feeText}.\n\nమీరు స్లాట్ బుక్ చేయాలనుకుంటున్నారా?${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `సరేనండి! ${docTitle} గారి కోసం ఈరోజు లేదా రేపటికి అపాయింట్‌మెంట్ బుక్ చేయడానికి దయచేసి రోగి పేరు మరియు సమయాన్ని పంపండి.${phoneSuffix}`;
    }
    return `నమస్కారం! 🙏 నేను ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) రిసెప్షనిస్ట్.\n\nనేను మీకు అపాయింట్‌మెంట్ లేదా క్లినిక్ వివరాలలో ఎలా సహాయపడగలను?${phoneSuffix}`;
  }

  if (isKannada || isMalayalam || isBengali || isGujarati || isPunjabi) {
    if (/timing|samay|time|opd|hours/i.test(textLower)) {
      return `${docTitle} OPD Timings: *${clinicTimings}*.\n\nWould you like to book an appointment for today or tomorrow?${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `Sure! To book an appointment with ${docTitle} (${specialty}), please share the **Patient Name** and preferred **Date (Today or Tomorrow)**.${phoneSuffix}`;
    }
    return `Namaste! 🙏 I am ${assistantName}, receptionist at *${clinicName}* (${docTitle} · ${specialty}). How may I help you with an appointment today?${phoneSuffix}`;
  }

  // ════ 2. HINDI / HINGLISH / MIXED LANGUAGE HANDLING ══════════════════════
  if (isHindiOrHinglish) {
    // 2.1 Late / Traffic / Timing delay / "Mushkil pahuch payenge" / "6:30 ho gya"
    if (/late|delay|pahuch|mushkil|already|traffic|time\s*pe|aaj\s*nahi|nahi\s*ho\s*payega|deir|der|time\s*kam|ruk|wait|paunch|मुश्किल|पहुँच|देर/i.test(textLower) || text.includes("मुश्किल")) {
      return `Koi baat nahi ji! Agar aaj clinic time pe pahunchne me dikkat ho rahi hai, toh kya main aapka slot **kal (tomorrow)** ke liye book kar doon?\n\nDr. Siddhant kal shaam *${clinicTimings}* tak OPD me uplabdh rahenge.${phoneSuffix}`;
    }

    // 2.2 Address / Location / Directions / "Clinic kaha hai"
    if (/address|location|kahan|kaha|rasta|directions|map|कहाँ|पता|लोकेशन|रास्ता|एड्रेस/i.test(textLower) || text.includes("कहाँ") || text.includes("पता")) {
      if (clinicAddress) {
        return `Clinic ka address hai:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${clinicTimings}*\nKya aap aaj visit plan kar rahe hain?${phoneSuffix}`;
      }
      return `Hamara clinic *${clinicName}* par sthit hai. Exact address ke liye aap clinic reception par direct call bhi kar sakte hain.${phoneSuffix}`;
    }

    // 2.3 Fee / Pricing Inquiry
    if (/fee|charge|cost|price|kitna|kitni|paisa|rupee|rate|फीस|शुल्क|खर्च|रुपये/i.test(textLower) || text.includes("फीस") || text.includes("शुल्क")) {
      const feeText = cleanFee ? `Consultation fees *₹${cleanFee}* hai` : "Consultation fees ki details clinic par consultation ke samay di jaati hain";
      return `${docTitle} (${specialty}) ki ${feeText}.\n\nKya aap aaj ya kal ke liye slot book karna chahenge?${phoneSuffix}`;
    }

    // 2.4 Timings / Schedule Inquiry
    if (/timing|samay|kab|time|opd|hours|khula|schedule|समय|टाइम|कब/i.test(textLower) || text.includes("समय") || text.includes("टाइम")) {
      return `${docTitle} clinic me OPD consultations ke liye uplabdh hain:\n🕒 *${clinicTimings}*\n\nKya aap *aaj* ya *kal* ke liye appointment schedule karna chahenge?${phoneSuffix}`;
    }

    // 2.5 Appointment Booking Request / "Appointment chahiye" / "Kal milna hai"
    if (/appointment|book|visit|consult|slot|milna|dikhana|aana|chahiye|booking|apointment|apointmnt|अपॉइंटमेंट|बुक|मिलना|दिखाना|चाहिए|स्लॉट/i.test(textLower) || text.includes("अपॉइंटमेंट") || text.includes("चाहिए")) {
      return `Ji bilkul! ${docTitle} (${specialty}) ke sath appointment ke liye kripya patient ka **Naam**, **Date (aaj ya kal)** aur **Morning ya Evening session** share karein. Main turant confirm kar dungi!${phoneSuffix}`;
    }

    // 2.6 Tomorrow / Specific Date / Kal preference
    if (/\b(kal|tomorrow|parso|aaj|today|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(textLower) || text.includes("कल") || text.includes("आज")) {
      return `Ji theek hai! Slot confirm karne ke liye kripya **Patient ka Pura Naam** bata dijiye. ${docTitle} OPD me *${clinicTimings}* uplabdh rahenge.${phoneSuffix}`;
    }

    // 2.7 Affirmation / Confirmation ("haan", "yes", "thik hai", "ok", "kardo")
    if (/^(haan|ha|ji|yes|yep|sure|thik\s*hai|theek\s*hai|ok|okay|kardo|kar\s*do|theek)\b/i.test(textLower) || textLower === "ok" || textLower === "haan") {
      return `Ji, kripya **Patient ka Pura Naam** aur preferred **Date** share karein, main turant booking confirm kar deti hoon!${phoneSuffix}`;
    }

    // 2.8 If it's a pure first greeting ("hi", "hello", "namaste") on an empty chat
    if (!isOngoingChat && (/^(hi|hello|hey|namaste|pranam|hlo|helo|hii+)\b/i.test(textLower) || textLower.length <= 4)) {
      return `Namaste! 🙏 Main ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) se bol rahi hoon.\n\nMain aapki appointment ya clinic se judi kis jankari me madad kar sakti hoon?${phoneSuffix}`;
    }

    // 2.9 Ongoing conversation Hindi/Hinglish Fallback (NEVER re-greets)
    if (isOngoingChat) {
      return `Ji! Kya aap ${docTitle} ke sath **aaj** ya **kal** ke liye appointment slot book karna chahenge? Kripya apna naam aur samay batayein.${phoneSuffix}`;
    }

    return `Namaste! 🙏 Main ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) se bol rahi hoon. Kya aap aaj ya kal ke liye appointment book karna chahenge?${phoneSuffix}`;
  }

  // ════ 3. ENGLISH (Professional, Warm & Human) ════════════════════════════
  // 3.1 Late / Delay handling
  if (/late|delay|reach|traffic|cannot\s*make|difficult|not\s*possible|unable/i.test(textLower)) {
    return `No problem at all! If today is difficult to reach on time, would you like me to schedule your consultation with ${docTitle} for **tomorrow** instead? (OPD Timings: ${clinicTimings})${phoneSuffix}`;
  }

  // 3.2 Timings & OPD Hours
  if (/timing|hours|schedule|time|open|when\s*is|opd/i.test(textLower)) {
    return `${docTitle} is available for clinic consultations during OPD hours:\n🕒 *${clinicTimings}*\n\nWould you like to schedule an appointment for *today* or *tomorrow*? Please share your preferred time and patient name.${phoneSuffix}`;
  }

  // 3.3 Appointment Booking / Schedule
  if (/appointment|book|visit|consult|slot|schedule|available|doctor|reserve/i.test(textLower)) {
    return `${docTitle} is available during OPD hours:\n🕒 *${clinicTimings}*\n\nTo reserve your slot, please reply with the **Patient Full Name**, preferred **Date**, and **Morning or Evening session**. I will be happy to confirm it for you!${phoneSuffix}`;
  }

  // 3.4 Fees & Pricing
  if (/fee|charge|cost|price|how\s*much|rate/i.test(textLower)) {
    const feeText = cleanFee ? `Consultation fee is *₹${cleanFee}*` : "Consultation fee details are shared directly at the clinic during your visit";
    return `${feeText} for ${docTitle} (${specialty}).\n\nWould you like to reserve a consultation slot for today or tomorrow?${phoneSuffix}`;
  }

  // 3.5 Address, Location & Directions
  if (/address|location|where|directions|map|how\s*to\s*reach|find/i.test(textLower)) {
    if (clinicAddress) {
      return `Our clinic address is:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\n${docTitle} is available during OPD hours (${clinicTimings}).\n\nWould you like to schedule a visit?${phoneSuffix}`;
    }
    return `Our clinic is located at *${clinicName}*. For exact street directions or landmark guidance, please feel free to call our reception.${phoneSuffix}`;
  }

  // 3.6 Symptoms / Health Concern
  if (/fever|cough|pain|cold|vomit|headache|fracture|knee|baby|child|skin|teeth|allergy|injury|treatment|sick|ill/i.test(textLower)) {
    return `Thank you for sharing your concern. For proper clinical assessment and personalized care, we recommend an in-person OPD consultation with ${docTitle} (${specialty}).\n\nOPD Timings: *${clinicTimings}*\nWould you like to book a slot for today or tomorrow?${phoneSuffix}`;
  }

  // 3.7 First Greeting vs Ongoing chat
  if (!isOngoingChat && (/^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|hola|hii+|hl|hlo|helo)\b/i.test(textLower) || textLower.length <= 4)) {
    return `Hello! Namaste 🙏 I am ${assistantName}, receptionist at *${clinicName}* (${docTitle} · ${specialty}).\n\nHow may I assist you with an appointment or clinic inquiry today?${phoneSuffix}`;
  }

  if (isOngoingChat) {
    return `Understood! Would you like me to book a consultation slot with ${docTitle} (${specialty}) for **today** or **tomorrow**? Please share the patient's name and preferred time.${phoneSuffix}`;
  }

  return `Hello! Thank you for reaching out to *${clinicName}*. I am ${assistantName}, here to assist you with booking an appointment with ${docTitle} (${specialty}) or answering any clinic questions.\n\nWould you like to schedule an in-clinic visit for today or tomorrow?${phoneSuffix}`;
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
    const rawDocName = doctorProfile?.doctorName || config?.doctorName || "Doctor";
    const doctorName = formatDoctorDisplayName(rawDocName);
    const clinicName = doctorProfile?.clinicName || config?.clinicName || (doctorName !== "the Doctor" ? `${doctorName}'s Clinic` : "our Clinic");
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
    const customRules = config?.trainingPrompt || config?.customRules || "";
    const emergencyTriggers = config?.emergencyTriggers || "severe pain, bleeding, chest pain, trauma, emergency";

    try {
      const isPediatrician = /pediatr|paediatr|child|baby|bal/i.test(specialty) || /pediatr|paediatr|child/i.test(customRules);

      // Emergency Trigger Check
      const lowerMsg = incomingMessage.toLowerCase();
      const triggers = emergencyTriggers.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      const isEmergency = triggers.some((t: string) => lowerMsg.includes(t));

      if (isEmergency) {
        return `⚠️ *Emergency Notice*: If the patient is experiencing a severe medical emergency, chest pain, or trauma, please visit the nearest hospital emergency room immediately or call emergency medical services.`;
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

CRITICAL RECEPTIONIST INSTRUCTIONS:
1. **NATURAL, WARM & EMPATHETIC TONE**:
   - Write like a real, polite clinic receptionist on WhatsApp.
   - NEVER include robotic disclaimers like "(I am the clinic's AI assistant...)" or template disclaimers.
   - Do NOT duplicate titles (always refer to the doctor as "${doctorName}").

2. **AUTOMATIC LANGUAGE ADAPTATION (ENGLISH / HINGLISH / HINDI)**:
   - Match the patient's language naturally:
     * If the patient writes in Hindi/Devanagari ("नमस्ते", "अपॉइंटमेंट चाहिए", "फीस कितनी है"), respond in polite, warm Hindi.
     * If the patient writes in Hinglish ("timing kya hai", "fees kitni hai", "appointment book karna hai"), respond in natural, polite Hinglish ("Namaste ji! ${doctorName} clinic me OPD consultation ke liye uplabdh hain...").
     * If the patient writes in English, respond in warm, professional English.

3. **HANDLE PATIENT SYMPTOMS & HEALTH QUESTIONS**:
   - If the patient describes symptoms (fever, cough, pain, rash, weakness):
     * Acknowledge warmly and empathetically.
     * Recommend an in-person OPD consultation with ${doctorName} for proper evaluation.
     * Offer available OPD slots (${clinicTimings}).

4. **CHECK OPD TIMINGS BEFORE OFFERING SLOTS**:
   - Only offer slots during active OPD hours (${clinicTimings}).
   - If Morning OPD is not available, offer Evening slots only.

5. **APPOINTMENT BOOKING FLOW**:
   - To book an appointment, ask for their preferred **Date**, **Morning/Evening session**, and **Patient Full Name**.
   - Once they provide these details to confirm the booking, append this exact tag at the very end of your confirmation message:
     [BOOK_APPOINTMENT: YYYY-MM-DD, Session, Patient Full Name]

6. **HUMAN STAFF / PHONE INQUIRIES**:
   - If the patient explicitly asks to speak to human staff or asks for a phone number:
     * Share the clinic phone number warmly: "${clinicPhone ? `You can also call our clinic directly at ${clinicPhone}.` : ''}"
      `;

      const prompt = `
System Instructions:
${systemPrompt}

Conversation History:
${conversationHistory.join("\n")}

Patient's New Message: "${incomingMessage}"

Write your direct, crisp, natural WhatsApp reply to the patient:
      `;

      let aiReply = await generateWithFallback(prompt);

      // Clean up any stray legacy disclaimers or repetitive prefixes
      aiReply = aiReply
        .replace(/\(I am the clinic's AI assistant.*?\)/gi, "")
        .replace(/Our consultations are 30 minutes in duration\.?/gi, "")
        .replace(/30-minute consultation/gi, "consultation")
        .replace(/Dr\.\s+Dr\.?/gi, "Dr.")
        .trim();

      return aiReply;
    } catch (error: any) {
      console.error("[AIAgentsService] LLM generation error in Appointment Agent, using intelligent receptionist fallback:", error?.message || error);
      
      const isOngoingChat = conversationHistory && conversationHistory.length > 0;
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
        clinicPhone,
        isOngoingChat
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
