/**
 * Multi-Class Intent Classifier for Clinic WhatsApp Communications
 * 
 * Accurately categorizes incoming messages for medical practitioners into:
 * 1. TRANSACTIONAL_OTP: Bank OTPs, verification codes, transaction alerts (Discard silently)
 * 2. ACADEMIC_PUBLISHING_SPAM: Scopus, Embase, paper writing, journal indexing spam (Discard silently)
 * 3. CME_ACADEMIC_WEBINAR: Medical webinars, clinical series, symposium invites (Forward/Alert Doctor, 0 reply to sender)
 * 4. PHARMA_MEDICAL_REP: Pharma product promos, drug brochures, conference highlights (Silent escalation to Doctor, 0 appointment booking)
 * 5. PERSONAL_PEER: Friends, relatives, doctor peers chatting informally (Silent escalation to Doctor, NO schedule dump, NO OT/OPD claims)
 * 6. PATIENT_CARE: Legitimate patient inquiries, symptoms, booking, rescheduling, cancellations, test reports
 */

export type WhatsAppIntentCategory =
  | "TRANSACTIONAL_OTP"
  | "ACADEMIC_PUBLISHING_SPAM"
  | "CME_ACADEMIC_WEBINAR"
  | "PHARMA_MEDICAL_REP"
  | "PERSONAL_PEER"
  | "DIAGNOSTIC_LAB_NOTICE"
  | "PATIENT_CARE";

export interface IntentClassificationResult {
  category: WhatsAppIntentCategory;
  confidence: number;
  reason: string;
  doctorNotificationTitle?: string;
  doctorNotificationBody?: string;
  senderResponsePolicy: "SILENT_DROP" | "FORWARD_DOCTOR_NO_REPLY" | "ESCALATE_DOCTOR_NO_REPLY" | "PROCESS_PATIENT_CARE";
}

export function classifyWhatsAppMessage(
  textMessage: string,
  doctorName?: string | null,
  senderPhone?: string
): IntentClassificationResult {
  const text = (textMessage || "").trim();
  const textLower = text.toLowerCase();

  // 1. TRANSACTIONAL / BANKING OTPs / CARRIER ALERTS
  const isOtp = /\b(your otp is|one time password|verification code|do not share this otp|credited with inr|debited by inr|account balance is inr|recharge successful|pack expired|txn id|transaction id|atm pin|upi pin|bank account ending)\b/i.test(text);
  if (isOtp) {
    return {
      category: "TRANSACTIONAL_OTP",
      confidence: 1.0,
      reason: "Banking, OTP, or telecom transactional notice",
      senderResponsePolicy: "SILENT_DROP"
    };
  }

  // 2. ACADEMIC & PAPER PUBLISHING SPAM (e.g. Apex Scholar Research, Scopus, DOAJ)
  const isPublishingSpam = (
    /\b(apex scholar|manuscript preparation|publication assistance|indexed journals?|scopus|embase|doaj|journal selection|fast-track publication|international guideline compliance|submitapexa@gmail\.com|paper writing service|publish your research|publish in scopus|impact factor journal|call for papers?|research paper publishing)\b/i.test(textLower) ||
    (/\b(manuscript|journal|scopus|publication|research paper)\b/i.test(textLower) && /\b(assist|service|offer|publish|guarantee|indexing)\b/i.test(textLower))
  );
  if (isPublishingSpam) {
    return {
      category: "ACADEMIC_PUBLISHING_SPAM",
      confidence: 0.95,
      reason: "Unsolicited academic journal publishing / paper writing spam",
      senderResponsePolicy: "SILENT_DROP"
    };
  }

  // 3. CME / CLINICAL WEBINARS & ACADEMIC SYMPOSIA (e.g. Zorvia Healthcare Webinar)
  const isCmeOrWebinar = (
    /\b(webinar|academic series|clinicians'? dilemma|cordially invite you to episode|register & join|register and join|cme series|clinical webinar|grand rounds|symposium|virtual cme|panel discussion with dr\.|guest lecture|case discussion series)\b/i.test(textLower) ||
    (/\b(webinar|seminar|symposium|cme|academic session)\b/i.test(textLower) && /\b(register|invite|join|speaker|moderator|topic:|faculty)\b/i.test(textLower))
  );
  if (isCmeOrWebinar) {
    // Extract title / topic if possible
    const topicMatch = text.match(/(?:topic|topic\s*:|theme|titled?)\s*[:\-]?\s*([^\n\r.]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : "Medical Academic Webinar";
    const linkMatch = text.match(/https?:\/\/[^\s]+/i);
    const link = linkMatch ? linkMatch[0] : "";

    return {
      category: "CME_ACADEMIC_WEBINAR",
      confidence: 0.95,
      reason: "CME / Clinical webinar or academic series invitation",
      doctorNotificationTitle: "🎓 Academic Webinar / CME Invitation",
      doctorNotificationBody: `A clinical webinar invitation was received:\n• Topic: *${topic}*\n${link ? `• Link: ${link}\n` : ""}• From: ${senderPhone || "Doctor WhatsApp"}`,
      senderResponsePolicy: "FORWARD_DOCTOR_NO_REPLY"
    };
  }

  // 4. PHARMA & MEDICAL REPRESENTATIVES (MRs) PROMOTIONAL MESSAGES (e.g. Emcure, Dydrofem)
  const isPharmaPromo = (
    /\b(pharmaceuticals|pharma|emcure|sun pharma|cipla|torrent pharma|mankind|lupin|abbott|zydus|intas|glenmark|alembic|dr\.?\s*reddy'?s|novartis|pfizer)\b/i.test(textLower) ||
    /\b(brought to you by|purity that protects|dydrofem|conference highlights|asrm \d{4}|fogsi|medical representative|detailing of|product monograph|sample request)\b/i.test(textLower)
  );
  if (isPharmaPromo) {
    const brandMatch = text.match(/(?:brought to you by|greetings from)\s+([^\n\r.,!]+)/i);
    const brand = brandMatch ? brandMatch[1].trim() : "Pharma Partner";

    return {
      category: "PHARMA_MEDICAL_REP",
      confidence: 0.9,
      reason: "Pharma / Medical Representative product or conference update",
      doctorNotificationTitle: "💊 Pharma / Medical Representative Update",
      doctorNotificationBody: `A pharma product or clinical research update was received:\n• Sender/Brand: *${brand}*\n• Message: "${text.slice(0, 180)}..."`,
      senderResponsePolicy: "ESCALATE_DOCTOR_NO_REPLY"
    };
  }

  // 5. PERSONAL FRIENDS, RELATIVES & PEERS
  // Clean doctor name tokens (e.g., "Dr. Maanvvi Maaini" -> "Maanvvi", "Manvi")
  const docFirstName = (doctorName || "")
    .replace(/^(dr\.?|doctor|prof\.?|professor)\s+/i, "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase() || "";

  // Common nicknames/transliterations for doctor's first name
  const docNameVariants = [docFirstName].filter(n => n.length >= 3);
  if (docFirstName === "maanvvi") docNameVariants.push("manvi", "maanvi", "manvii");

  const hasPersonalGreetingToDoc = docNameVariants.some(variant => {
    const regex = new RegExp(`\\b(hi|hello|hey|dear)\\s+${variant}\\b|\\b${variant}\\s+(kesi|kaisi|how|dear|batao)\\b`, "i");
    return regex.test(textLower);
  });

  const isInformalPeerChat = (
    hasPersonalGreetingToDoc ||
    /\b(call me when u r free|call me when you are free|call me when free|free ho to call|call me dear|hw r u dear|how are you dear|bhai call karna|yaar kahan ho|ghar kab aa|milte hain sham|call karo dear)\b/i.test(textLower)
  );

  // Guard: If message contains strong clinical patient intent (fever, pain, appointment, consultation, fees, opd, report),
  // it is likely an acquaintance who is STILL asking for medical care.
  const hasStrongClinicalIntent = /\b(appointment|consult|slot|fee|fees|opd|timing|clinic|hospital|fever|cough|pain|bleeding|report|ultrasound|test|prescription|dawa|medicine|vomiting|treatment|bimar|checkup)\b/i.test(textLower);

  if (isInformalPeerChat && !hasStrongClinicalIntent) {
    return {
      category: "PERSONAL_PEER",
      confidence: 0.9,
      reason: "Informal personal peer, family or friend message addressing doctor casually",
      doctorNotificationTitle: "📱 Personal Message from Friend / Acquaintance",
      doctorNotificationBody: `A personal message was received from *${senderPhone || "Contact"}*:\n"${text}"\n\n_(The AI assistant has stayed silent so you can reply personally.)_`,
      senderResponsePolicy: "ESCALATE_DOCTOR_NO_REPLY"
    };
  }

  // 6. DIAGNOSTIC LAB / PATHOLOGY NOTICES (e.g. Lal PathLabs, Thyrocare, SRL, Metropolis, test report alerts)
  const isDiagnosticLabNotice = (
    /\b(thyrocare|lal pathlabs?|dr lal|metropolis|srl diagnostics?|pathkind|agilus|suburban diagnostics|apollo diagnostics|redcliffe|diagnostic center)\b/i.test(textLower) ||
    (/\b(diagnostic|pathology|radiology|lab report|test report|sample id|barcode)\b/i.test(textLower) && /\b(ready|collected|download|view report|attached|results?|released)\b/i.test(textLower)) ||
    /\b(report for patient|patient report is ready|sample has been collected|test results? are available at)\b/i.test(textLower)
  );

  if (isDiagnosticLabNotice) {
    return {
      category: "DIAGNOSTIC_LAB_NOTICE",
      confidence: 0.95,
      reason: "Automated diagnostic pathology or radiology lab notice",
      senderResponsePolicy: "SILENT_DROP"
    };
  }

  // 7. DEFAULT: LEGITIMATE PATIENT CARE & CLINICAL ENQUIRIES
  return {
    category: "PATIENT_CARE",
    confidence: 1.0,
    reason: "Legitimate patient clinical query, appointment scheduling, or clinic operation inquiry",
    senderResponsePolicy: "PROCESS_PATIENT_CARE"
  };
}
