import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { memoryCache } from "@/lib/memory-cache";

// Prioritized Gemini models: Primary gemini-3.7-flash (Low Thinking) -> Fallbacks: 3.6-flash -> 3.5-flash-lite
const CANDIDATE_MODELS = [
  "gemini-3.7-flash",      // Primary Gemini model with LOW thinking effort
  "gemini-3.6-flash",      // Fallback 1
  "gemini-3.5-flash-lite"  // Fallback 2
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

export interface ClinicPractitionerInfo {
  id?: string;
  name: string;
  phone?: string | null;
  specialty?: string | null;
  qualification?: string | null;
  consultationFee?: number | null;
  workingDays?: string[];
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  isOwner?: boolean;
}

function formatPractitionerTimings(p: ClinicPractitionerInfo): string {
  const days = (p.workingDays && p.workingDays.length > 0)
    ? p.workingDays.map(d => d.slice(0, 3)).join(", ")
    : "Mon-Sat";
  const start = p.workingHoursStart || "10:00 AM";
  const end = p.workingHoursEnd || "7:00 PM";
  return `${days}: ${start} - ${end}`;
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
  isOngoingChat: boolean = false,
  morningOpd?: string,
  eveningOpd?: string,
  practitioners?: ClinicPractitionerInfo[],
  websiteUrl?: string | null,
  allowTeleConsultation: boolean = false,
  teleConsultationFee?: string
): string {
  const text = incomingMessage.trim();
  const textLower = text.toLowerCase();

  // ════ Multi-Doctor Matching: Check if patient asked for a specific doctor ═
  let activeDoctorName = rawDoctorName;
  let activeSpecialty = specialty;
  let activeTimings = clinicTimings;
  let activeFee = consultationFee;

  if (practitioners && practitioners.length > 0) {
    // Find if text matches any specific doctor name or specialty
    const matchedDoctor = practitioners.find(p => {
      const pNameClean = p.name.replace(/^(dr\.?|doctor)\s+/i, '').toLowerCase().trim();
      const pSpecialty = (p.specialty || '').toLowerCase().trim();
      return (
        (pNameClean.length > 2 && textLower.includes(pNameClean)) ||
        (pSpecialty.length > 3 && textLower.includes(pSpecialty))
      );
    });

    if (matchedDoctor) {
      activeDoctorName = matchedDoctor.name;
      activeSpecialty = matchedDoctor.specialty || specialty;
      activeTimings = formatPractitionerTimings(matchedDoctor);
      if (matchedDoctor.consultationFee) {
        activeFee = String(matchedDoctor.consultationFee);
      }
    }
  }

  const docTitle = formatDoctorDisplayName(activeDoctorName);

  // ════ Determine Active OPD Sessions (Morning / Evening / Single session) ═
  const hasMorning = Boolean(
    (morningOpd && morningOpd.trim().length > 0 && !/closed|none|na|n\/a/i.test(morningOpd)) ||
    (/morning/i.test(activeTimings) && !/morning\s*(opd)?:\s*(closed|none|na)/i.test(activeTimings))
  );

  const hasEvening = Boolean(
    (eveningOpd && eveningOpd.trim().length > 0 && !/closed|none|na|n\/a/i.test(eveningOpd)) ||
    (/evening/i.test(activeTimings) && !/evening\s*(opd)?:\s*(closed|none|na)/i.test(activeTimings))
  );

  const activeEveningHours = eveningOpd || (activeTimings.match(/Evening\s*(?:OPD)?:\s*([^|]+)/i)?.[1]?.trim() || "");
  const activeMorningHours = morningOpd || (activeTimings.match(/Morning\s*(?:OPD)?:\s*([^|]+)/i)?.[1]?.trim() || "");

  let slotPromptEn = "preferred **Date** and **Time**";
  let slotPromptHi = "**Date (aaj ya kal)** aur **Time**";

  if (hasMorning && hasEvening) {
    slotPromptEn = "preferred **Date**, and **Morning or Evening session**";
    slotPromptHi = "**Date (aaj ya kal)** aur **Morning ya Evening time**";
  } else if (hasEvening) {
    slotPromptEn = `preferred **Date (Today or Tomorrow)** for the **Evening OPD (${activeEveningHours || activeTimings})**`;
    slotPromptHi = `preferred **Date (aaj ya kal)** for **Evening OPD (${activeEveningHours || activeTimings})**`;
  } else if (hasMorning) {
    slotPromptEn = `preferred **Date (Today or Tomorrow)** for the **Morning OPD (${activeMorningHours || activeTimings})**`;
    slotPromptHi = `preferred **Date (aaj ya kal)** for **Morning OPD (${activeMorningHours || activeTimings})**`;
  }

  // ════ SCRIPT & DIALECT DETECTION (NATIVE SCRIPTS + ROMANIZED REGIONAL TRANSLITERATIONS) ═
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasTamil = /[\u0B80-\u0BFF]/.test(text);
  const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
  const hasKannada = /[\u0C80-\u0CFF]/.test(text);
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(text);
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
  const hasPunjabi = /[\u0A00-\u0A7F]/.test(text);

  // Strong Hindi grammar markers
  const hasHindiMarkers = hasDevanagari || /\b(kya|kab|kahan|kaha|kaise|kitna|kitni|chahiye|milna|aana|hai|hain|bhi|ji|hlo|namaste|pranam|batao|bataiye|bataya|batayein|samay|fees|aaj|aj|kal|parso|late|mushkil|pahuch|pahuchenge|thik|theek|kardo|kar|ho|raha|rahi|gya|gaya|pehle|abhi|hu|hoon|hume|humko|mera|meri|karna|karvana|baje|subah|shaam|dopahar|pakka)\b/i.test(textLower);

  // Romanized Transliteration Keywords (Only match if NOT standard Hindi/Hinglish)
  const isBonglish = hasBengali || (!hasHindiMarkers && /\b(ami|amra|apnader|tumi|tomra|aasbo|ashbo|ashchi|aschhi|bolchhen|bolchen|bolte|kothay|daktar|dekhabo|shomoye|thakben|thakbe|dhonnobad|kalke|aajke|ajke)\b/i.test(textLower));
  const isTanglish = hasTamil || (!hasHindiMarkers && /\b(vanakkam|naan|nanga|neenga|ungalukku|vara|varren|varen|vandhuten|naalaikku|nalaikku|innikku|iniku|epbo|eppo|evvalo|evvalavu|panam|kaasu|paakanum|paarka|pakanum|irukka|iruku|irukku|kedaikkuma|engae|enge|enga|solla|sollunga|nandri|seri|mudiyuma|mudiyum)\b/i.test(textLower));
  const isTelugish = hasTelugu || (!hasHindiMarkers && /\b(namaskaram|namaskaramu|nenu|memu|meeru|repu|ee\s*roju|eeroju|vastanu|vastam|vasta|eppudu|enta|entha|chupinchali|chudali|unnara|untara|undha|ekkada|ekada|cheppandi|cheppu|dhanyavadalu)\b/i.test(textLower));
  const isMarathish = !hasDevanagari && !hasHindiMarkers && /\b(namaskar|mee|amhi|tumhi|udya|aajch|yenar|yeto|yete|kadhi|kiti|dakhvaycha|bhetaycha|aahet|nahit|kuthe|kothe|sanga|saanga|dhanyawad)\b/i.test(textLower);
  const isKanglish = hasKannada || (!hasHindiMarkers && /\b(namaskara|naanu|naavu|neevu|nimma|naale|ivathu|ee\s*dina|bartheeni|barodu|barala|yaavaga|yaava|eshtu|thorisbeku|nodbeku|iddara|irthara|elli|ellige|heli|helra|dhanyavadagalu)\b/i.test(textLower));
  const isManglish = hasMalayalam || (!hasHindiMarkers && /\b(namaskaram|njan|njangal|ningal|naale|innu|varam|varunnu|eppol|eppozhum|ethra|kanikkanam|kaananam|undo|undavumo|evide|evidaya|parayamo|parayoo|nanni)\b/i.test(textLower));
  const isGujlish = hasGujarati || (!hasHindiMarkers && /\b(kem\s*cho|majama|tamaro|tamari|aavishu|aavvu|kyare|ketla|batavvu|malvu|kyaan|janavo|aabhar|gujarati)\b/i.test(textLower));
  const isPunlish = hasPunjabi || (!hasHindiMarkers && /\b(sat\s*sri\s*akaal|sasrikal|assi|tussi|ajj|aaunga|aunde|kadon|kado|kinne|kinni|dikhauna|hanji|haanji|kithe|kithay|dasso|dasan|dhanwad)\b/i.test(textLower));

  // International / Global Languages
  const isSpanish = /\b(hola|buenos\s*dias|buenas\s*tardes|buenas\s*noches|cita|doctor|gracias|precio|consulta|saludos|adonde|donde|quiero)\b/i.test(textLower);
  const isFrench = /\b(bonjour|bonsoir|salut|rendez-vous|medecin|merci|horaires|docteur|combien)\b/i.test(textLower);
  const isArabic = /[\u0600-\u06FF]/.test(text) || /\b(marhaban|salam|shukran|tabib|maw3id|ahlan)\b/i.test(textLower);

  const isHindiOrHinglish = hasHindiMarkers || (!isBonglish && !isTanglish && !isTelugish && !isMarathish && !isKanglish && !isManglish && !isGujlish && !isPunlish && !isSpanish && !isFrench && !isArabic);

  // User explicitly asking for phone / human call
  const wantsCallOrHuman = /human|speak|call|phone|number|contact|talk|baat|phone\s*number/i.test(textLower);
  const phoneSuffix = (wantsCallOrHuman && clinicPhone && clinicPhone.trim().length > 3)
    ? `\n\n📞 Aap direct clinic reception par *${clinicPhone.trim()}* par bhi call kar sakte hain.`
    : (wantsCallOrHuman && clinicPhone)
    ? `\n\n📞 You can also reach our clinic reception directly at *${clinicPhone.trim()}*.`
    : "";

  const cleanFee = consultationFee ? consultationFee.replace(/[^\d.,]/g, '').trim() : "";

  // ════ 1. SPANISH (Native & Polite) ═════════════════════════════════════════
  if (isSpanish) {
    if (/cita|consulta|reservar|agendar|doctor|horario/i.test(textLower)) {
      return `¡Hola! Con gusto podemos agendar su cita con ${docTitle} (${activeSpecialty}). Por favor comparta el **Nombre completo del paciente** y la **Fecha deseada** (Hoy o Mañana). Horario de atención: *${activeTimings}*.${phoneSuffix}`;
    }
    return `¡Hola! 👋 Soy ${assistantName}, recepcionista de *${clinicName}* (${docTitle} · ${activeSpecialty}). ¿En qué puedo ayudarle hoy con su consulta o cita médica?${phoneSuffix}`;
  }

  // ════ 2. FRENCH (Native & Polite) ══════════════════════════════════════════
  if (isFrench) {
    if (/rendez-vous|rdv|reserver|consultation|docteur|horaires/i.test(textLower)) {
      return `Bonjour ! Pour confirmer votre rendez-vous avec ${docTitle} (${activeSpecialty}), veuillez indiquer le **Nom complet du patient** et la **Date souhaitée**. Horaires : *${activeTimings}*.${phoneSuffix}`;
    }
    return `Bonjour ! 👋 Je suis ${assistantName}, réceptionniste à *${clinicName}* (${docTitle} · ${activeSpecialty}). Comment puis-je vous aider aujourd'hui ?${phoneSuffix}`;
  }

  // ════ 3. ARABIC (Native & Polite) ══════════════════════════════════════════
  if (isArabic) {
    return `مرحباً بك! 👋 أنا ${assistantName}، مساعدة العيادة في *${clinicName}* مع ${docTitle} (${activeSpecialty}). أوقات العيادة: *${activeTimings}*. كيف يمكنني مساعدتك في حجز موعد اليوم؟${phoneSuffix}`;
  }

  // ════ 4. BENGALI / BONGLISH ══════════════════════════════════════════════
  if (isBonglish) {
    // 4.1 Late-night / 24x7 inquiry (e.g. "Eto raat tumi ki appointment dite paren?")
    if (/eto\s*raat|eto\s*rat|raat\s*e|raate|rate|open|khula|24\/7|kokhon/i.test(textLower)) {
      return `Hyan nishchoi! Amader 24/7 AI Receptionist shob shomoy active thake aapnar appointment book korar jonno 😊\n\n${docTitle} (${activeSpecialty}) clinic-e agami OPD consultations-er jonno thakben (*${activeTimings}*).\n\nSlot reserve korar jonno doya kore **Patient-er Puro Naam** o **Date (Aaj ba Kal)** share korun. Ami ekhoni confirm kore debo!${phoneSuffix}`;
    }
    if (/bolchhen|bolchen|bolte|bangla|bengali|বাংলা/i.test(textLower)) {
      return `Hyan! Ami Bangla bujhte o bolte pari 😊 *${clinicName}*-e ${docTitle} (${activeSpecialty})-er sathe appointment ba jankari-r jonno ami kivabe sahajjo korte pari?${phoneSuffix}`;
    }
    if (/late|deri|somoy|ashchi|shomoy|time\s*pe|mushkil/i.test(textLower)) {
      return `Kono byapar na! Aaj asha jodi oshubidha hoy, tahole ki ami aapnar slot **kal (tomorrow)**-er jonno book kore debo?\n\n${docTitle} kal OPD-te *${activeTimings}* thakben.${phoneSuffix}`;
    }
    if (/kothay|address|location|thikana|jaayga|map|কোথায়|ঠিকানা/i.test(textLower)) {
      if (clinicAddress) {
        return `Clinic-er address:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${activeTimings}*\nApni ki aaj visit korte chan?${phoneSuffix}`;
      }
      return `Amader clinic *${clinicName}*-e sthito. Exact address-er jonno reception-e jogajog korte paren.${phoneSuffix}`;
    }
    if (/koto|fee|fees|cost|charge|taka|টাকা|খরচ/i.test(textLower)) {
      const feeText = cleanFee ? `Consultation fee *₹${cleanFee}*` : "Consultation fee clinic-e consultation-er somoy janano hoy";
      return `${docTitle} (${activeSpecialty})-er ${feeText}.\n\nApni ki aaj ba kal slot book korte chan?${phoneSuffix}`;
    }
    if (/shomoy|timing|somoy|kokhon|khula|opd|সময়|কখন/i.test(textLower)) {
      return `${docTitle} clinic-e OPD consultations-er jonno thakben:\n🕒 *${activeTimings}*\n\nApni ki *aaj* ba *kal* appointment schedule korte chan?${phoneSuffix}`;
    }
    if (/appointment|book|aasbo|ashbo|dekhte|dekhabo|daktar|slot|chahiye|kal|aaj|কাল|আজ|আসছি|দেখাতে/i.test(textLower)) {
      return `Hyan nishchoi! ${docTitle} (${activeSpecialty})-er sathe appointment confirm korar jonno doya kore **Patient-er Puro Naam** o preferred **Date (Aaj ba Kal)** share korun. Ami ekhoni confirm kore debo!${phoneSuffix}`;
    }
    if (/^(hi|hello|hey|namaste|nomoshkar|pranam|helo|hlo|hii+)\b/i.test(textLower) || textLower.length <= 4) {
      return `Nomoshkar! 🙏 Ami ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty})-er receptionist.\n\nAmi kivabe aapnar appointment ba clinic-er jankari-te sahajjo korte pari?${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `Hyan! Apni ki ${docTitle} (${activeSpecialty})-er sathe **aaj** ba **kal** appointment slot book korte chan? Doya kore patient-er puro naam o somoy janan.${phoneSuffix}`;
    }
    return `Nomoshkar! 🙏 Ami ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty})-er receptionist.\n\nAmi kivabe aapnar appointment ba clinic-er jankari-te sahajjo korte pari?${phoneSuffix}`;
  }

  // ════ 5. TAMIL / TANGLISH ════════════════════════════════════════════════
  if (isTanglish) {
    if (/tamil|thamizh|pesuveengala|தமிழ்/i.test(textLower)) {
      return `Aam! Enakku Tamil theriyum 😊 *${clinicName}* la ${docTitle} (${activeSpecialty}) kooda appointment book panna eppadi udhava mudiyum?${phoneSuffix}`;
    }
    if (/late|neram|mudiyala|varamudiyadhu|reach|traffic/i.test(textLower)) {
      return `Kavalai pada vendaam! Innikku vara mudiyala na, ungalukku **naalaikku (tomorrow)** slot book panlatuma?\n\n${docTitle} naalaikku OPD la *${activeTimings}* irupaaru.${phoneSuffix}`;
    }
    if (/engae|enge|enga|address|location|edam|map|எங்கே|முகவரி/i.test(textLower)) {
      if (clinicAddress) {
        return `Clinic address:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${activeTimings}*\nInnikku visit panna poringala?${phoneSuffix}`;
      }
      return `Namma clinic *${clinicName}* la irukku. Address ku reception ku call pannalaam.${phoneSuffix}`;
    }
    if (/evvalo|evvalavu|fee|fees|cost|charge|panam|kaasu|கட்டணம்/i.test(textLower)) {
      const feeText = cleanFee ? `Consultation fee *₹${cleanFee}*` : "Consultation fee vivaram clinic la therivikkapadum";
      return `${docTitle} (${activeSpecialty}) ${feeText}.\n\nInnikku illa naalaikku slot book panna virumbureengala?${phoneSuffix}`;
    }
    if (/neram|timing|epbo|eppo|opd|நேரம்/i.test(textLower)) {
      return `${docTitle} clinic la OPD consultation kidaikkum neram:\n🕒 *${activeTimings}*\n\nInnikku illa naalaikku appointment schedule panna virumbureengala?${phoneSuffix}`;
    }
    if (/appointment|book|vara|varren|varen|paakanum|paarka|slot|naalaikku|innikku|முன்பதிவு/i.test(textLower)) {
      return `Kandippa! ${docTitle} (${activeSpecialty}) kooda appointment confirm panna **Patient Muzhu Peyar** matrum **Date (Innikku / Naalaikku)** sollunga. Naan udane confirm panniduren!${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `Seri! ${docTitle} (${activeSpecialty}) kooda **innikku** illa **naalaikku** appointment book panna patient peyar matrum neram sollunga.${phoneSuffix}`;
    }
    return `Vanakkam! 🙏 Naan ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) receptionist. Ungalukku eppadi udhava mudiyum?${phoneSuffix}`;
  }

  // ════ 6. TELUGU / TELUGISH ══════════════════════════════════════════════
  if (isTelugish) {
    if (/telugu|matladathara|తెలుగు/i.test(textLower)) {
      return `Avunu andi! Nenu Telugu matladagalanu 😊 *${clinicName}* lo ${docTitle} (${activeSpecialty}) garitho appointment kosam ela sahayam cheyagalanu?${phoneSuffix}`;
    }
    if (/late|raalenu|kudaradu|traffic|time\s*ki/i.test(textLower)) {
      return `Parvaledu andi! Ee roju raavadam kastam ayithe, mee slot **repu (tomorrow)** ki book cheyannaa?\n\n${docTitle} repu OPD lo *${activeTimings}* untaru.${phoneSuffix}`;
    }
    if (/ekkada|ekada|address|location|chota|map|ఎక్కడ/i.test(textLower)) {
      if (clinicAddress) {
        return `Clinic address:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${activeTimings}*\nEe roju visit chestunnara?${phoneSuffix}`;
      }
      return `Maa clinic *${clinicName}* lo undi. Exact address kosam reception ki call cheyavachhu.${phoneSuffix}`;
    }
    if (/enta|entha|fee|fees|cost|charge|kharchu|ఫీజు/i.test(textLower)) {
      const feeText = cleanFee ? `Consultation fee *₹${cleanFee}*` : "Fee vivaralu clinic lo theliyajeyabadathayi";
      return `${docTitle} (${activeSpecialty}) ${feeText}.\n\nEe roju leda repu slot book cheyalanukuntunnara?${phoneSuffix}`;
    }
    if (/timing|samayam|eppudu|opd|సమయం/i.test(textLower)) {
      return `${docTitle} clinic lo OPD consultation samayam:\n🕒 *${activeTimings}*\n\nMeeru *ee roju* leda *repu* appointment schedule cheyalanukuntunnara?${phoneSuffix}`;
    }
    if (/appointment|book|vastanu|vasta|chupinchali|chudali|slot|repu|ee\s*roju|అపాయింట్‌మెంట్/i.test(textLower)) {
      return `Tappakunda andi! ${docTitle} (${activeSpecialty}) garitho appointment confirm cheyadaniki daya chesi **Patient Pura Peru** mariyu **Date (Ee roju / Repu)** cheppandi. Nenu ventane confirm chestanu!${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `Sare andi! ${docTitle} (${activeSpecialty}) garitho **ee roju** leda **repu** appointment book cheyadaniki patient peru mariyu samayam cheppandi.${phoneSuffix}`;
    }
    return `Namaskaram! 🙏 Nenu ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) receptionist. Nenu meeku ela sahayam cheyagalanu?${phoneSuffix}`;
  }

  // ════ 7. MARATHI / MARATHISH ══════════════════════════════════════════════
  if (isMarathish) {
    if (/marathi|bolta|मराठी/i.test(textLower)) {
      return `Ho! Mala Marathi kalte o bolta yete 😊 *${clinicName}* madhe ${docTitle} (${activeSpecialty}) sobat appointment sathi me kashi madat karu shakte?${phoneSuffix}`;
    }
    if (/late|ushir|jamnar\s*nahi|traffic/i.test(textLower)) {
      return `Kahi harkat nahi! Aaj yene shakya nasel, tar tumcha slot **udya (tomorrow)** sathi book karu ka?\n\n${docTitle} udya OPD madhe *${activeTimings}* uplabdha astil.${phoneSuffix}`;
    }
    if (/kuthe|kothe|address|location|patta|map|कुठे|पत्ता/i.test(textLower)) {
      if (clinicAddress) {
        return `Clinic cha patta:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${activeTimings}*\nTumhi aaj bhet denar aahat ka?${phoneSuffix}`;
      }
      return `Aamche clinic *${clinicName}* ye the aahe. Exact address sathi reception var call kara.${phoneSuffix}`;
    }
    if (/kiti|fee|fees|cost|charge|paise|फी/i.test(textLower)) {
      const feeText = cleanFee ? `Consultation fee *₹${cleanFee}* aahe` : "Consultation fee chi mahiti clinic madhe dili jaate";
      return `${docTitle} (${activeSpecialty}) chi ${feeText}.\n\nTumhi aaj ki udya sathi slot book karu ichhita ka?${phoneSuffix}`;
    }
    if (/vel|timing|kadhi|opd|वेळ/i.test(textLower)) {
      return `${docTitle} clinic madhe OPD consultation sathi uplabdha astat:\n🕒 *${activeTimings}*\n\nTumhi *aaj* ki *udya* appointment schedule karu ichhita ka?${phoneSuffix}`;
    }
    if (/appointment|book|yenar|yeto|yete|dakhvaycha|bhetaycha|slot|udya|aaj|अपॉइंटमेंट/i.test(textLower)) {
      return `Ho nishchit! ${docTitle} (${activeSpecialty}) sobat appointment confirm karnyasathi krupaya **Patient che Purna Naav** aani **Date (Aaj ki Udya)** sanga. Me lagech confirm karte!${phoneSuffix}`;
    }
    if (isOngoingChat) {
      return `Ho! Tumhi ${docTitle} (${activeSpecialty}) sobat **aaj** ki **udya** sathi appointment book karu ichhita ka? Krupaya patient che naav aani vel sanga.${phoneSuffix}`;
    }
    return `Namaskar! 🙏 Me ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) chi receptionist. Me aapli kashi madat karu shakte?${phoneSuffix}`;
  }

  // ════ 8. KANNADA, MALAYALAM, GUJARATI, PUNJABI ══════════════════════════
  if (isKanglish) {
    if (/timing|samaya|yaavaga|opd/i.test(textLower)) {
      return `${docTitle} OPD Timings: *${activeTimings}*.\n\nNaale athava ivathu appointment book maadabeka?${phoneSuffix}`;
    }
    if (isOngoingChat || /appointment|book|bartheeni|thorisbeku|naale|ivathu/i.test(textLower)) {
      return `Khanditha! ${docTitle} (${activeSpecialty}) jothe appointment confirm maadalu daya maadi **Patient Purna Hesaru** mathu **Date (Ivathu / Naale)** thilisi.${phoneSuffix}`;
    }
    return `Namaskara! 🙏 Naanu ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) receptionist. Naanu nimage hege sahaya maadabahudu?${phoneSuffix}`;
  }

  if (isManglish) {
    if (/samayam|timing|eppol|opd/i.test(textLower)) {
      return `${docTitle} OPD Timings: *${activeTimings}*.\n\nInno athava naale appointment book cheyyano?${phoneSuffix}`;
    }
    if (isOngoingChat || /appointment|book|varam|kanikkanam|naale|innu/i.test(textLower)) {
      return `Theerchayayum! ${docTitle} (${activeSpecialty}) aayi appointment confirm cheyyanayi **Patient-nte Muzhuvan Peru** mariyu **Date (Innu / Naale)** parayoo.${phoneSuffix}`;
    }
    return `Namaskaram! 🙏 Njan ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) receptionist. Njan engane sahayam cheyyatte?${phoneSuffix}`;
  }

  if (isGujlish) {
    if (/samay|timing|kyare|opd/i.test(textLower)) {
      return `${docTitle} OPD Timings: *${activeTimings}*.\n\nAaje ke kale appointment book karvu che?${phoneSuffix}`;
    }
    if (isOngoingChat || /appointment|book|aavishu|batavvu|kale|aaje/i.test(textLower)) {
      return `Chokkas! ${docTitle} (${activeSpecialty}) sathe appointment confirm karva mate krupya **Patient nu Pura Naam** ane **Date (Aaje / Kale)** janavo.${phoneSuffix}`;
    }
    return `Namaste! 🙏 Hu ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) receptionist. Hu tamari shu madad kari shaku?${phoneSuffix}`;
  }

  if (isPunlish) {
    if (/time|timing|kadon|opd/i.test(textLower)) {
      return `${docTitle} OPD Timings: *${activeTimings}*.\n\nAjj ya kal appointment book karni hai?${phoneSuffix}`;
    }
    if (isOngoingChat || /appointment|book|aaunga|dikhauna|kal|ajj/i.test(textLower)) {
      return `Hanji bilkul! ${docTitle} (${activeSpecialty}) naal appointment confirm karan layi **Patient da Pura Naam** te **Date (Ajj / Kal)** dasso.${phoneSuffix}`;
    }
    return `Sat Sri Akaal! 🙏 Main ${assistantName}, *${clinicName}* (${docTitle} · ${activeSpecialty}) receptionist. Main twadi ki madad kar sakdi aan?${phoneSuffix}`;
  }

  // ════ 9. HINDI / HINGLISH / MIXED LANGUAGE HANDLING ══════════════════════
  if (isHindiOrHinglish) {
    // 9.0 Biopsy / Genetic Testing / Lab Reports in Hindi/Hinglish
    if (/biopsy|histopath|fnac|genetic|karyotype|nipt|exome|genome|dna|report|blood\s*test|sugar|lipid|thyroid|usg|ultrasound|x-ray|xray|जाँच|रिपोर्ट|बायोप्सी|जेनेटिक/i.test(textLower)) {
      if (/genetic|karyotype|nipt|exome|genome|dna|जेनेटिक/i.test(textLower)) {
        if (/nipt/i.test(textLower)) {
          return `NIPT (Non-Invasive Prenatal Testing) report me lagbhag **5 se 7 working days** lagte hain.${phoneSuffix}`;
        }
        if (/karyotype/i.test(textLower)) {
          return `Karyotyping (Chromosomal Analysis) report me lagbhag **10 se 14 working days** lagte hain kyunki isme cell culture zaroori hota hai.${phoneSuffix}`;
        }
        if (/exome|genome|wes|wgs/i.test(textLower)) {
          return `Whole Exome / Genome Sequencing reports me comprehensive NGS analysis ke karan **2 se 4 weeks** ka samay lagta hai.${phoneSuffix}`;
        }
        return `Genetic test reports ka samay test ke type par nirbhar karta hai (NIPT: 5–7 din, Karyotyping: 10–14 din, Exome/Genome Panels: 2–4 weeks). Kripya specific test ka naam batayein taaki main exact timeline bata sakoon.${phoneSuffix}`;
      }
      if (/biopsy|histopath|fnac|बायोप्सी/i.test(textLower)) {
        return `Biopsy / Histopathology test reports me **7 se 10 working days** ka samay lagta hai kyunki isme tissue processing aur detailed pathologist verification ki zaroorat hoti hai.${phoneSuffix}`;
      }
      if (/report|kab|ready|milegi|milega|status|रिपोर्ट/i.test(textLower)) {
        return `Routine blood test reports (CBC, Sugar, Thyroid, LFT, KFT) **same day sham 6:00 PM tak** ready ho jaati hain. Specialized tests me 24–48 ghante, Biopsy me 7–10 din, aur Genetic tests me 1–3 weeks lagte hain.${phoneSuffix}`;
      }
      if (/blood\s*test|sugar|lipid|fasting|ghar|home\s*sample/i.test(textLower)) {
        return `Fasting Sugar aur Lipid Profile ke liye 10–12 ghante ki fasting zaroori hai. Hamare certified phlebotomist home blood sample collection ke liye bhi uplabdh hain.\n\nKya aap center visit karna chahenge ya home sample collection book karwana hai?${phoneSuffix}`;
      }
    }

    // 9.01 Critical Red-Flag Emergency Triage
    if (/chest\s*pain|heart\s*attack|saans\s*nahi|breathless|unconscious|heavy\s*bleeding|khoon\s*behta|stroke|paralysis|poison|zehar|severe\s*burn|head\s*injury/i.test(textLower)) {
      return `⚠️ *Emergency Alert*: Yeh sthiti aapatkaleen (emergency) lag rahi hai. Kripya turant nearest hospital emergency room (ICU/Casualty) pahuchein ya Ambulance (108/112) ko call karein. Clinic OPD standard appointments aapatkaleen sthiti ke liye anukul nahi hain.`;
    }

    // 9.02 Medication Dosage & Prescription Safety Shield
    if (/\b(kitna\s*ml|kitni\s*goli|kitna\s*mg|dose|dosage|how\s*many\s*ml|how\s*many\s*drops|paracetamol|antibiotic|combiflam|augmentin|dawa\s*kitni)\b/i.test(textLower)) {
      return `Kripya dhyan dein: Patient ki suraksha ke liye dawa ki sahi dose (mg/ml) keval doctor physical checkup ke baad nirdharit kar sakte hain. Kripya clinic ki likhi parchi (prescription) dekhein ya OPD timings me ${docTitle} se direct consult karein.${phoneSuffix}`;
    }

    // 9.03 Medical Certificate & Sick Leave Policy
    if (/medical\s*certificate|fitness\s*certificate|sick\s*leave|leave\s*letter|parchi\s*bhejo/i.test(textLower)) {
      return `Medical illness ya fitness certificate kanooni roop se bina doctor ke samne aaye nahi diya ja sakta. Certificate ke liye kripya valid ID ke sath ${docTitle} (${specialty}) ke OPD me physical consultation ke liye padharein.${phoneSuffix}`;
    }

    // 9.04 Follow-up & Report Review Policy
    if (/report\s*dikhana|report\s*check|follow\s*up|dikhaya\s*tha|pehle\s*aaye\s*the|dubara\s*dikhana/i.test(textLower)) {
      return `Ji bilkul! Agar aapne pichle 7 dino ke andar ${docTitle} (${specialty}) ko consult kiya tha, to test report review ka koi alag se consultation fee nahi lagta. Kripya clinic ke OPD hours (*${clinicTimings}*) me apni physical report ke sath aaiye.${phoneSuffix}`;
    }

    // 9.1 Late night / 24x7 question
    if (/itni\s*raat|raat\s*ko|raat\s*me|open|khula|24\/7/i.test(textLower) && /appointment|mil|hoga|book/i.test(textLower)) {
      return `Ji bilkul! Hamara 24/7 automated receptionist kisi bhi samay agle din ke OPD slot ke liye appointment book kar sakta hai 😊\n\n${docTitle} (${specialty}) OPD me *${clinicTimings}* uplabdh rahenge. Kripya patient ka **Naam** aur **Date (aaj ya kal)** share karein, main turant reserve kar deti hoon!${phoneSuffix}`;
    }

    // 9.2 Late / Traffic / Timing delay
    if (/late|delay|pahuch|mushkil|already|traffic|time\s*pe|aaj\s*nahi|nahi\s*ho\s*payega|deir|der|time\s*kam|ruk|wait|paunch|मुश्किल|पहुँच|देर/i.test(textLower) || text.includes("मुश्किल")) {
      return `Koi baat nahi ji! Agar aaj clinic time pe pahunchne me dikkat ho rahi hai, toh kya main aapka slot **kal (tomorrow)** ke liye book kar doon?\n\n${docTitle} kal *${clinicTimings}* OPD me uplabdh rahenge.${phoneSuffix}`;
    }

    // 9.3 Address / Location / Directions
    if (/address|location|kahan|kaha|rasta|directions|map|कहाँ|पता|लोकेशन|रास्ता|एड्रेस/i.test(textLower) || text.includes("कहाँ") || text.includes("पता")) {
      if (clinicAddress) {
        return `Clinic ka address hai:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${clinicTimings}*\nKya aap aaj visit plan kar rahe hain?${phoneSuffix}`;
      }
      return `Hamara clinic *${clinicName}* par sthit hai. Exact address ke liye aap clinic reception par direct call bhi kar sakte hain.${phoneSuffix}`;
    }

    // 9.4 Fee / Pricing Inquiry
    if (/fee|charge|cost|price|kitna|kitni|paisa|rupee|rate|फीस|शुल्क|खर्च|रुपये/i.test(textLower) || text.includes("फीस") || text.includes("शुल्क")) {
      const feeText = cleanFee ? `Consultation fees *₹${cleanFee}* hai` : "Consultation fees ki details clinic par consultation ke samay di jaati hain";
      return `${docTitle} (${specialty}) ki ${feeText}.\n\nKya aap aaj ya kal ke liye slot book karna chahenge?${phoneSuffix}`;
    }

    // 9.5 Timings / Schedule Inquiry
    if (/timing|samay|kab|time|opd|hours|khula|schedule|समय|टाइम|कब/i.test(textLower) || text.includes("समय") || text.includes("टाइम")) {
      return `${docTitle} clinic me OPD consultations ke liye uplabdh hain:\n🕒 *${clinicTimings}*\n\nKya aap *aaj* ya *kal* ke liye appointment schedule karna chahenge?${phoneSuffix}`;
    }

    // 9.55 Urgent Health Concern / Acute Symptoms (Fever, severe pain, emergency, acute illness)
    if (/fever|bukhar|dard|pain|cough|khasi|cold|sardi|vomit|ult[ie]|tabiyat|kharab|headache|sar\s*dard|emergency|chot|injury|sick|ill|severe|jyada/i.test(textLower)) {
      return `Aapki tabiyat jaldi theek ho 🙏 ${docTitle} (${specialty}) clinic me OPD hours (*${clinicTimings}*) me uplabdh rahenge. Agar bukhar/takleef bahut jyada hai to kripya direct clinic aakar emergency walk-in token le lijiye ya nearest hospital me dikhayein. Kya main aapka OPD slot reserve kar doon?${phoneSuffix}`;
    }

    // 9.6.1 User explicitly states they already provided their name / details
    if (/abhi\s*to\s*naam|pehle\s*hi|already|naam\s*bataya|naam\s*to|de\s*diya/i.test(textLower)) {
      return `Ji mafi chahti hoon! Maine aapki details note kar li hain. ${docTitle} (${specialty}) ke OPD session ke liye aapki appointment request register ho gayi hai. Clinic reception se aapko WhatsApp confirmation mil jayegi.${phoneSuffix}`;
    }

    // 9.6.2 User asking if appointment is confirmed
    if (/confirm\s*appointment|confirm\s*hai|pakka|is\s*it\s*confirmed|confirm\s*karein|confirm\s*hua/i.test(textLower)) {
      return `Ji bilkul! ${docTitle} (${specialty}) ke pass aapka appointment slot confirm hai. Kripya nirdharit samay par clinic pahuchein. Dhanyawad! 🙏${phoneSuffix}`;
    }

    // 9.6.3 Appointment details provided (Date + Time + Name)
    if (/\b(kal|tomorrow|parso|aaj|today|pm|am|baje|subah|shaam|evening|morning|\d{1,2}(?:st|nd|rd|th)?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*)\b/i.test(textLower) || /\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)/i.test(textLower)) {
      return `Ji dhanyawad! Maine *${text}* ke liye ${docTitle} (${specialty}) ke OPD session me aapki appointment request note kar li hai. Clinic reception se aapko turant token SMS/WhatsApp mil jayega. Agar koi aur jankari chahiye to zaroor batayein!${phoneSuffix}`;
    }

    // 9.6 Appointment Booking Request (General Inquiry without date/time)
    if (/appointment|book|visit|consult|slot|milna|dikhana|aana|chahiye|booking|apointment|apointmnt|अपॉइंटमेंट|बुक|मिलना|दिखाना|चाहिए|स्लॉट/i.test(textLower) || text.includes("अपॉइंटमेंट") || text.includes("चाहिए")) {
      return `Ji bilkul! ${docTitle} (${specialty}) ke sath appointment ke liye kripya patient ka **Naam** aur ${slotPromptHi} share karein. Main turant confirm kar dungi!${phoneSuffix}`;
    }

    // 9.8 Affirmation / Confirmation
    if (/^(haan|ha|ji|yes|yep|sure|thik\s*hai|theek\s*hai|ok|okay|kardo|kar\s*do|theek)\b/i.test(textLower) || textLower === "ok" || textLower === "haan") {
      return `Ji, kripya **Patient ka Pura Naam** aur preferred **Date** share karein, main turant booking confirm kar deti hoon!${phoneSuffix}`;
    }

    // 9.9 Greetings in Hindi
    if (/^(hi|hello|hey|namaste|pranam|hlo|helo|hii+)\b/i.test(textLower) || textLower.length <= 4) {
      return `Namaste! 🙏 Main ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) se bol rahi hoon.\n\nMain aapki appointment ya clinic se judi kis jankari me madad kar sakti hoon?${phoneSuffix}`;
    }

    if (isOngoingChat) {
      return `Ji dhanyawad! Maine *${text}* ke liye aapki request note kar li hai. ${docTitle} (${specialty}) ke OPD slot ki confirmation details clinic reception se aapko WhatsApp par mil jayegi.${phoneSuffix}`;
    }

    return `Namaste! 🙏 Main ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) se bol rahi hoon. Kya aap aaj ya kal ke liye appointment book karna chahenge?${phoneSuffix}`;
  }

  // ════ 10. ENGLISH (Professional, Warm & Human) ═══════════════════════════
  // 10.0 Biopsy / Genetic Testing / Pathology / Test Report Turnaround
  if (/biopsy|histopath|fnac|genetic|karyotype|nipt|exome|genome|dna|culture|blood\s*test|report|cbc|thyroid|tsh|lipid|sugar|usg|ultrasound|x-ray|xray|scan|mri|ct\s*scan/i.test(textLower)) {
    if (/genetic|karyotype|nipt|exome|genome|dna/i.test(textLower)) {
      if (/nipt/i.test(textLower)) {
        return `NIPT (Non-Invasive Prenatal Testing) reports take **5 to 7 working days** as the sample undergoes advanced NGS sequencing.${phoneSuffix}`;
      }
      if (/karyotype/i.test(textLower)) {
        return `Karyotyping (Chromosomal Analysis) reports take **10 to 14 working days** due to cell culture and metaphase banding requirements.${phoneSuffix}`;
      }
      if (/exome|genome|wes|wgs/i.test(textLower)) {
        return `Clinical Exome and Whole Genome Sequencing reports take **2 to 4 weeks** due to extensive genomic bioinformatics curation.${phoneSuffix}`;
      }
      return `Genetic test turnaround times vary based on the prescribed test:\n• NIPT: 5–7 working days\n• Karyotyping: 10–14 working days\n• Exome / Gene Panels: 2–3 weeks\n• Whole Genome (WGS): 3–4 weeks\n\nPlease share the exact test name for specific timeline details.${phoneSuffix}`;
    }
    if (/biopsy|histopath|fnac/i.test(textLower)) {
      return `Biopsy and Histopathology test reports take **7 to 10 working days** due to specialized tissue processing and detailed pathologist examination.${phoneSuffix}`;
    }
    if (/culture/i.test(textLower)) {
      return `Culture & Sensitivity reports take **48 to 72 hours** for bacterial incubation.${phoneSuffix}`;
    }
    if (/report|when|ready|status/i.test(textLower)) {
      return `Routine blood test reports (CBC, Sugar, Thyroid, LFT, KFT) are generated **same-day by 6:00 PM – 7:00 PM**. Specialized tests take 24–48 hours, Biopsy reports take 7–10 days, and Genetic panels take 1–3 weeks.${phoneSuffix}`;
    }
    if (/blood\s*test|sugar|lipid|fasting|home\s*sample/i.test(textLower)) {
      return `For Fasting Blood Sugar and Lipid Profile tests, 10–12 hours overnight fasting is required (water is permitted). Certified phlebotomists are also available for home sample pickup.\n\nWould you like to book a center visit or request home blood sample pickup?${phoneSuffix}`;
    }
  }

  // 10.1 Late night / 24x7 inquiry
  if (/late\s*night|night|open\s*now|24\/7|open\s*at\s*night/i.test(textLower)) {
    return `Yes! Our 24/7 digital assistant is always active to reserve your upcoming consultation slot. ${docTitle} is available during OPD hours (${clinicTimings}). Would you like to reserve a slot for today or tomorrow?${phoneSuffix}`;
  }

  // 10.2 Late / Delay handling
  if (/late|delay|reach|traffic|cannot\s*make|difficult|not\s*possible|unable/i.test(textLower)) {
    return `No problem at all! If today is difficult to reach on time, would you like me to schedule your consultation with ${docTitle} for **tomorrow** instead? (OPD Timings: ${clinicTimings})${phoneSuffix}`;
  }

  // 10.3 Timings & OPD Hours
  if (/timing|hours|schedule|time|open|when\s*is|opd/i.test(textLower)) {
    return `${docTitle} is available for clinic consultations during OPD hours:\n🕒 *${clinicTimings}*\n\nWould you like to schedule an appointment for *today* or *tomorrow*? Please share your preferred time and patient name.${phoneSuffix}`;
  }

  // 10.35 Appointment Details Provided in English (Name, Date, Time)
  if (isOngoingChat && (/\b(tomorrow|today|pm|am|evening|morning|\d{1,2}(?:st|nd|rd|th)?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*)\b/i.test(textLower) || /\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(textLower) || text.length > 2)) {
    return `Thank you! I have registered your appointment request for *${text}* with ${docTitle} (${specialty}). Our clinic front desk will send your booking confirmation token shortly on WhatsApp.${phoneSuffix}`;
  }

  // 10.36 Confirmation Query in English
  if (/is\s*it\s*confirmed|is\s*this\s*confirmed|confirm\s*appointment|booked|status/i.test(textLower)) {
    return `Yes, certainly! Your appointment request has been received for ${docTitle} (${specialty}). Please arrive a few minutes before your scheduled OPD slot. Thank you! 🙏${phoneSuffix}`;
  }

  // 10.4 Appointment Booking / Schedule
  if (/appointment|book|visit|consult|slot|schedule|available|doctor|reserve/i.test(textLower)) {
    return `${docTitle} is available during OPD hours:\n🕒 *${clinicTimings}*\n\nTo reserve your slot, please reply with the **Patient Full Name** and your ${slotPromptEn}. I will be happy to confirm it for you!${phoneSuffix}`;
  }

  // 10.5 Fees & Pricing
  if (/fee|charge|cost|price|how\s*much|rate/i.test(textLower)) {
    const feeText = cleanFee ? `Consultation fee is *₹${cleanFee}*` : "Consultation fee details are shared directly at the clinic during your visit";
    return `${feeText} for ${docTitle} (${specialty}).\n\nWould you like to reserve a consultation slot for today or tomorrow?${phoneSuffix}`;
  }

  // 10.6 Address, Location & Directions
  if (/address|location|where|directions|map|how\s*to\s*reach|find/i.test(textLower)) {
    if (clinicAddress) {
      return `Our clinic address is:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\n${docTitle} is available during OPD hours (${clinicTimings}).\n\nWould you like to schedule a visit?${phoneSuffix}`;
    }
  }

  // 10.7 Symptoms / Health Concern
  if (/fever|cough|pain|cold|vomit|headache|fracture|knee|baby|child|skin|teeth|allergy|injury|treatment|sick|ill/i.test(textLower)) {
    return `Thank you for sharing your concern. For proper clinical assessment and personalized care, we recommend an in-person OPD consultation with ${docTitle} (${specialty}).\n\nOPD Timings: *${clinicTimings}*\nWould you like to book a slot for today or tomorrow?${phoneSuffix}`;
  }

  // 10.75 Home Collection & Lab Sample Preference
  if (/home\s*collection|home\s*sample|home\s*pickup|ghar\s*pe|ghar\s*se/i.test(textLower)) {
    return `Ji bilkul! Home blood sample pickup ke liye kripya **Patient ka Pura Naam**, **Address**, aur preferred **Morning timing (7:00 AM - 9:30 AM)** share kar dijiye. Certified phlebotomist time par pahunch jayenge.${phoneSuffix}`;
  }
  if (/center\s*visit|clinic\s*visit|lab\s*visit|clinic\s*aake/i.test(textLower)) {
    return `Ji! Clinic visit ke liye aap subah 8:00 AM se sham 7:30 PM ke beech kisi bhi samay sample de sakte hain. Fasting tests ke liye 10-12 ghante khali pet aana zaroori hai. Kya main aapka slot reserve kar doon?${phoneSuffix}`;
  }

  // 10.8 Universal Greeting Matcher (First message only)
  if (!isOngoingChat && (/^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|hola|hii+|hl|hlo|helo)\b/i.test(textLower) || textLower.length <= 4)) {
    return `Hello! Namaste 🙏 I am ${assistantName}, receptionist at *${clinicName}* (${docTitle} · ${specialty}).\n\nHow may I assist you with an appointment or clinic inquiry today?${phoneSuffix}`;
  }

  if (isOngoingChat) {
    return `Thank you! I have noted your details (*${text}*) for ${docTitle} (${specialty}). Our clinic front desk will share your booking confirmation on WhatsApp shortly.${phoneSuffix}`;
  }

  return `Hello! Thank you for reaching out to *${clinicName}*. I am ${assistantName}, here to assist you with booking an appointment with ${docTitle} (${specialty}) or answering any clinic questions.\n\nWould you like to schedule an in-clinic visit for today or tomorrow?${phoneSuffix}`;
}

export interface DoctorScheduleContext {
  opdStatus?: string; // ACTIVE, RUNNING_LATE, PAUSED, CANCELLED
  opdDelayMinutes?: number;
  opdStatusNote?: string | null;
  maxDailyAiBookings?: number | null;
  todayAiCount?: number;
  isTodayQuotaFull?: boolean;
  bookedSlotsToday?: string[];
  pacingStrategy?: string; // STAGGERED or CONTINUOUS
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout of ${timeoutMs}ms exceeded for ${label}`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function generateWithFallback(prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  let lastError: any = null;

  // 1. Primary & Fallback Gemini Models (Strict per-model timeout: 4s max)
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const is37 = modelName.includes("3.7");
          const configObj: any = {
            temperature: 0.3,
            maxOutputTokens: 600
          };
          if (is37) {
            // Configure Low Thinking Effort for sub-second conversational latency
            configObj.thinkingConfig = {
              thinkingBudget: 0
            };
          }

          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: configObj
          });

          const response = await withTimeout(generatePromise, 4000, modelName);
          if (response.text?.trim()) {
            return response.text.trim();
          }
        } catch (err: any) {
          lastError = err;
          const errText = err.message || err.toString() || "";
          console.warn(`[AIAgentsService] Model ${modelName} failed/timed out (${errText}).`);
          
          // Fast failover immediately on 429 Quota Exceeded
          if (/429|quota|resourceexhausted|too many requests/i.test(errText)) {
            console.warn(`[AIAgentsService] ⚡ Gemini 429 Quota Limit detected. Triggering instant failover to OpenAI...`);
            break;
          }
        }
      }
    } catch (gErr: any) {
      lastError = gErr;
      console.warn(`[AIAgentsService] GoogleGenAI init failed:`, gErr?.message || gErr);
    }
  }

  // 2. Secondary: Fast Fallback to OpenAI gpt-4o-mini (Strict 4s timeout)
  if (openaiKey) {
    try {
      console.log("[AIAgentsService] 🚀 Generating with OpenAI gpt-4o-mini fallback...");
      const openai = new OpenAI({ apiKey: openaiKey });
      const openaiPromise = openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.3
      });
      const completion = await withTimeout(openaiPromise, 4000, "OpenAI gpt-4o-mini");
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (oErr: any) {
      lastError = oErr;
      console.warn(`[AIAgentsService] OpenAI fallback failed/timed out:`, oErr?.message || oErr);
    }
  }

  throw lastError || new Error("All AI generation providers unavailable");
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
    clinicMapsUri?: string | null,
    practitioners?: ClinicPractitionerInfo[],
    websiteUrl?: string | null,
    scheduleContext?: DoctorScheduleContext
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
    
    // Tele-Consultation & Online Care Settings
    const allowTeleConsultation = config?.allowTeleConsultation === true;
    const teleConsultationFee = config?.teleConsultationFee || "";
    const teleConsultationHours = config?.teleConsultationHours || "";

    // Services & Vaccination List
    const vaccinationsList = config?.vaccinationsList || "BCG, Polio, Hepatitis B, DTP, Rotavirus, MMR, Flu Shot";
    const servicesOffered = config?.servicesOffered || "General OPD Consultation, Health Checkup";

    // Persona & Language
    const assistantName = config?.assistantName || "Riya";
    const customRules = config?.trainingPrompt || config?.customRules || "";
    const emergencyTriggers = config?.emergencyTriggers || "severe pain, bleeding, chest pain, trauma, emergency";
    const targetDemographics = config?.targetDemographics || "all";

    try {
      const isPediatrician = /pediatr|paediatr|child|baby|bal/i.test(specialty) || /pediatr|paediatr|child/i.test(customRules);

      // Emergency Trigger Check
      const lowerMsg = incomingMessage.toLowerCase();
      const triggers = emergencyTriggers.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      const isEmergency = triggers.some((t: string) => lowerMsg.includes(t));

      if (isEmergency) {
        return `⚠️ *Emergency Notice*: If the patient is experiencing a severe medical emergency, chest pain, or trauma, please visit the nearest hospital emergency room immediately or call emergency medical services.`;
      }

      const startTime = Date.now();
      const currentDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      // Live OPD Status & Capacity Context
      const opdStatus = scheduleContext?.opdStatus || "ACTIVE";
      const opdDelay = scheduleContext?.opdDelayMinutes || 0;
      const todayQuotaFull = Boolean(scheduleContext?.isTodayQuotaFull);
      const bookedSlots = scheduleContext?.bookedSlotsToday && scheduleContext.bookedSlotsToday.length > 0
        ? `\n- Currently Booked Slots for Today: ${scheduleContext.bookedSlotsToday.join(", ")}`
        : "";

      // Clinic Location (sourced from connected GMB/GBP profile — never hardcoded)
      const locationBlock = clinicAddress
        ? `- Clinic Address: ${clinicAddress}${clinicMapsUri ? `\n- Google Maps Link: ${clinicMapsUri}` : ''}`
        : null;

      // Multi-Doctor Directory
      const practitionersBlock = practitioners && practitioners.length > 0
        ? `\nCLINIC DOCTORS & PRACTITIONERS DIRECTORY:\n` + practitioners.map(p => {
            const pName = formatDoctorDisplayName(p.name);
            const pSpec = p.specialty || specialty;
            const pTimings = formatPractitionerTimings(p);
            const pFee = p.consultationFee ? `₹${p.consultationFee}` : (consultationFee ? `₹${consultationFee}` : "Standard");
            return `- ${pName} (${pSpec}) | OPD Timings: ${pTimings} | Consultation Fee: ${pFee}`;
          }).join("\n")
        : null;

      const systemPrompt = `
You are ${assistantName}, the compassionate, highly experienced, professional Senior Clinic Receptionist at ${clinicName} (${doctorName} - ${specialty}).

==================================================
1. CORE RECEPTIONIST PERSONALITY & TONE
==================================================
- **Role & Persona**: Warm, calm, respectful, reassuring, empathetic, human-sounding, and concise. You write naturally like a caring medical receptionist on WhatsApp.
- **Emotional Intelligence & Intent Recognition**:
  * Identify the patient's emotional state (e.g., worried, anxious, in pain, frustrated, scared, urgent, confused, relieved, thankful, neutral).
  * Adapt your tone appropriately:
    - If Worried / Anxious / Scared: "Ji, aapki chinta samajh sakti hoon. 🙏 Aap pareshan na hon, main appointment ke liye aapki madad karti hoon."
    - If In Pain / Acute Symptoms: "Ji, samajh sakti hoon ki aisi takleef mein aap jaldi doctor ko dikhana chahenge. 🙏 Main available options check karti hoon."
    - If Frustrated: "Ji, asuvidha ke liye khed hai. Main isse clear karne mein aapki poori madad karti hoon."
  * **Authentic vs Fake Empathy**:
    - DO NOT claim personal internal feelings (NEVER say "I feel your pain", "I am scared for you", "I am worried").
    - Express empathy through professional, caring language ("Ji, main samajh sakti hoon ki aisi situation pareshan karne wali ho sakti hai").
    - Never overuse empathy or repeat "Don't worry" repeatedly.
    - Keep responses concise (1 to 3 short sentences). Use at most 0–2 natural emojis (e.g., 🙏, 😊).

==================================================
2. CURRENT PATIENT MESSAGE HAS ABSOLUTE PRIORITY
==================================================
- Always evaluate the patient's LATEST message for their CURRENT INTENT before continuing any previous conversation script.
- If the patient introduces a NEW concern (e.g., acute fever, severe pain, child vomiting, cancellation, price inquiry), DO NOT blindly repeat the previous question (like asking for date/name).
- Address their new concern directly and with clinical awareness.

==================================================
3. ZERO-HALLUCINATION & FACTUAL ACCURACY POLICY
==================================================
- **Core Principle: Empathetic through Language, NEVER Imaginative with Facts**:
  * You demonstrate empathy purely through polite, respectful receptionist language, while remaining completely honest about actual clinic availability.
  * If a patient requests a specific time (e.g., "6 PM") and that time is full or outside OPD hours, NEVER invent or confirm it simply to please the patient.
    Instead reply honestly: "Ji, abhi 6 PM ka slot available nahi hai. Main aapko jo nearest available option mil raha hai woh bata deti hoon."
- **Strict Factual Reliance**: You may ONLY state facts provided in the clinic configuration, doctor schedule, and authoritative data below.
- **Never Invent Information**:
  * Never invent doctor availability, consultation fees, timings, room numbers, holidays, or booking IDs.
  * Distinguish between *possible OPD hours* and *confirmed booking*. Only confirm when booking details are finalized with the booking tag.
- **Handling Unknown Information**:
  * If requested information is not in your data, gracefully acknowledge: "Ji, iski exact information verify karke hi main aapko confirm kar sakti hoon." Never guess.

==================================================
4. MEDICAL HALLUCINATION PREVENTION & SAFETY
==================================================
- **You are a Clinic Receptionist, NOT a Doctor**:
  * NEVER diagnose patients or guess illness causes (NEVER say "Ye viral fever hai" or "Ye serious nahi hai").
  * Explain: "Fever/symptoms ke kai causes ho sakte hain. Doctor physically evaluate karke better advise karenge."
- **Prescription & Dosage Shield**:
  * NEVER recommend drug dosages, mg/ml amounts, or prescribe medications over WhatsApp.
  * Direct patients to check their written clinic prescription or consult ${doctorName} during OPD.
- **Emergency & Red-Flag Triage**:
  * If the patient reports life-threatening symptoms (severe chest pain, difficulty breathing, seizures, loss of consciousness, heavy bleeding, stroke symptoms, poisoning, trauma):
    IMMEDIATELY advise emergency care: "⚠️ *Emergency Notice*: Jo symptoms aap bata rahe hain woh potentially serious ho sakte hain. Kripya appointment ka wait na karein aur turant nearest hospital emergency room (ICU/Casualty) pahuchein ya Ambulance (108/112) ko call karein."

==================================================
5. PATIENT DETAILS, AGE, GENDER & MULTI-FAMILY PROFILES
==================================================
- **Progressive Single-Line Details Collection**:
  * To confirm a booking, ask for: **Date**, **OPD Session (Morning / Evening)**, and **Patient Details (Full Name, Age & Gender)** in a single natural prompt:
    "Kripya patient ka Full Name, Age aur Gender (M/F) share kar dijiye taaki main slot confirm kar sakoon. 🙏"
- **Intelligent Contextual Auto-Inference**:
  * If the patient mentions relationship or pronouns, auto-infer gender naturally:
    - "mere bete / son / bhai / husband / father" -> Gender: MALE
    - "meri beti / daughter / behan / wife / mother" -> Gender: FEMALE
  * If age or gender is omitted by the patient (e.g. they only provide "Samarth Hardik"), DO NOT interrogate repeatedly; proceed with confirmation and record whatever details were provided.
- **Proxy & Family Member Bookings**:
  * When a user books for someone else (e.g., "mere bete Aarav ke liye"), extract the beneficiary's name as the Patient Full Name.
- **Retain Conversational Memory**:
  * Remember details already provided. Never re-ask for details already in the conversation history.

==================================================
6. CLINIC DATA & AUTHORITATIVE SPECIFICATIONS
==================================================
TODAY'S DATE: ${currentDateStr} (Indian Standard Time)
- Primary Doctor: ${doctorName}
- Specialty: ${specialty}
- Clinic Name: ${clinicName}
- Morning OPD Hours: ${morningOpd || "Not Active / Check Schedule"}
- Evening OPD Hours: ${eveningOpd || "Not Active / Check Schedule"}
- Full Schedule: ${clinicTimings}
- Sunday Policy: ${sundayRule}
- Doctor Live Status Today: ${opdStatus} ${opdDelay > 0 ? `(Running ~${opdDelay} mins late due to hospital procedures)` : ""}
- Today's Quota Status: ${todayQuotaFull ? "FULLY BOOKED FOR TODAY (QUOTA REACHED)" : "SLOTS AVAILABLE"}
${bookedSlots}
${websiteUrl ? `- Official Clinic Website: ${websiteUrl}` : ""}
${practitionersBlock ? practitionersBlock : ""}
${locationBlock ? locationBlock : ""}

FEES & POLICIES:
- Consultation Fee: ${consultationFee || "Shared at clinic"}
- Follow-up Policy: ${followUpFee ? `₹${followUpFee}` : "₹0 / Free"} for returning patients within ${followUpDays} of initial visit for report review.
- Tele-Consultation: ${allowTeleConsultation ? `ENABLED (${teleConsultationFee || 'Standard Fee'})` : "IN-CLINIC ONLY (Online consultation / WhatsApp prescription not provided)"}
- Pediatric Vaccines: ${isPediatrician ? vaccinationsList : "N/A (Pediatric clinics only)"}
- Services Offered: ${servicesOffered}
${customRules ? `- Doctor Custom Guidelines: "${customRules}"` : ""}

==================================================
7. BOOKING & RESCHEDULING TAGS
==================================================
- To confirm a booking once details are finalized, append this exact tag at the very end of your confirmation message:
  [BOOK_APPOINTMENT: YYYY-MM-DD, Session, Patient Full Name, Age, Gender]
  *(If Age or Gender are not provided, you may emit: [BOOK_APPOINTMENT: YYYY-MM-DD, Session, Patient Full Name])*
- If patient explicitly asks to cancel:
  [CANCEL_PATIENT_APPOINTMENT]
- If patient explicitly asks to reschedule an existing booking:
  [RESCHEDULE_APPOINTMENT: YYYY-MM-DD, Session, Patient Full Name]
`;

      const prompt = `
System Instructions:
${systemPrompt}

Conversation History:
${conversationHistory.join("\n")}

🚨 PATIENT'S LATEST MESSAGE (PRIMARY CURRENT INTENT): "${incomingMessage}"

OUTPUT REQUIREMENT:
Respond with ONLY the exact, final WhatsApp message text for the patient. Do NOT include internal reasoning, headers, labels, or formatting markers. Output only the receptionist's warm, direct reply:
      `;

      let aiReply = await generateWithFallback(prompt);

      const latency = Date.now() - startTime;
      console.log(`[AIAgentsService] 💬 Receptionist Response generated in ${latency}ms`);

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
        isOngoingChat,
        morningOpd,
        eveningOpd,
        practitioners,
        websiteUrl,
        allowTeleConsultation,
        teleConsultationFee
      );
    }
  }

  /**
   * 1.2. DEMO & SANDBOX RECEPTIONIST AGENT
   * Shares the exact same clinical logic, multi-lingual scripts, and guardrails as the Doctor's panel.
   */
  static async runDemoReceptionist(
    incomingMessage: string,
    doctorProfile: {
      doctorName: string;
      clinicName: string;
      specialty: string;
      assistantName: string;
      consultationFee?: number | string;
      allowTeleConsultation?: boolean;
      teleConsultationFee?: number | string;
      clinicTimings?: string;
      clinicPhone?: string;
    },
    conversationHistory: string[] = []
  ): Promise<string> {
    const rawDocName = doctorProfile.doctorName || "Doctor";
    const doctorName = formatDoctorDisplayName(rawDocName);
    const clinicName = doctorProfile.clinicName || `${doctorName}'s Clinic`;
    const specialty = doctorProfile.specialty || "Medical Specialist";
    const assistantName = doctorProfile.assistantName || "Riya";
    const fee = String(doctorProfile.consultationFee || 800);
    const teleFee = String(doctorProfile.teleConsultationFee || 1000);
    const allowTele = doctorProfile.allowTeleConsultation !== false;
    const timings = doctorProfile.clinicTimings || "Mon-Sat: 10:00 AM - 1:00 PM & 5:00 PM - 8:30 PM";

    return await this.runAppointmentAgent(
      "demo_sandbox",
      incomingMessage,
      conversationHistory,
      {
        doctorName: rawDocName,
        clinicName,
        specialty,
        assistantName,
        consultationFee: fee,
        teleConsultationFee: teleFee,
        allowTeleConsultation: allowTele,
        clinicTimings: timings,
        trainingPrompt: `You are ${assistantName}, the dedicated 24/7 AI Receptionist for ${doctorName} at ${clinicName} (${specialty}).`,
      },
      doctorProfile.clinicPhone,
      { doctorName: rawDocName, clinicName, specialty }
    );
  }

  /**
   * 1.5. WHATSAPP INTERNAL DOCTOR & STAFF ASSISTANT
   * Highly Competent Delegated Task Management Assistant for Doctor
   */
  static async runStaffAssistantAgent(
    doctorId: string,
    incomingMessage: string,
    conversationHistory: string[],
    appointments: any[],
    doctorProfile?: { doctorName?: string; clinicName?: string; assistantName?: string }
  ) {
    try {
      const doctorName = doctorProfile?.doctorName || "Doctor";
      const clinicName = doctorProfile?.clinicName || "our Clinic";
      const assistantName = doctorProfile?.assistantName || "Riya";
      
      // Format the schedule context for the AI
      const scheduleLines = appointments.map(apt => {
        const timeStr = new Date(apt.startTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(apt.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' });
        const patientName = apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}`.trim() : "Unknown Patient";
        const patientPhone = apt.patient?.phone || "N/A";
        return `- [ID: ${apt.id}] ${dateStr} at ${timeStr} | ${patientName} (Phone: ${patientPhone}) | Status: ${apt.status}`;
      });

      const currentDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const scheduleContext = scheduleLines.length > 0 
        ? scheduleLines.join("\n") 
        : "There are no appointments scheduled in the fetched timeframe.";

      const systemPrompt = `
You are ${assistantName}, the dedicated, highly competent Medical Administrative Assistant and Clinic Receptionist reporting directly to ${doctorName} at ${clinicName}.

==================================================
1. DOCTOR-FACING PERSONALITY & COMMUNICATION STYLE
==================================================
- **Target Audience**: You are speaking directly with ${doctorName} (THE DOCTOR / CLINIC OWNER).
- **Tone**: Professional, respectful, concise, reliable, action-oriented, clear, and transparent.
- **DO NOT treat the doctor like a patient**: Avoid excessive emojis, emotional language, unsolicited medical triage, and long conversational filler.
- **Language Matching**: If the doctor writes in English, reply in English. If in Hindi/Hinglish, reply in Hindi/Hinglish.
- **Conciseness**: Keep replies to 1-2 direct sentences.

==================================================
2. ACKNOWLEDGE EVERY DELEGATED TASK (ZERO HALLUCINATION)
==================================================
- When the doctor delegates a task (e.g. contacting a patient, checking a slot, following up), clearly acknowledge:
  1. What task was understood
  2. Which patient/person it concerns
  3. What action will be taken next
- **Strict Verification Rule**:
  * NEVER say "Done", "I called the patient", "The patient confirmed", or "Appointment booked" unless the action has actually completed and verified.
  * While initiating a delegated task, say: "Understood, Doctor. I'll contact [Patient] and [Action]. I'll update you once their response is received."

==================================================
3. CLINICAL INSTRUCTIONS & SAFETY SHIELD
==================================================
- If the doctor gives clinical instructions to transmit to a patient (e.g., "Tell Mrs Sharma her report is normal and continue same medicine for 5 days"):
  * Preserve medication names, dosages, durations, and timings EXACTLY without alterations.
  * Append \`[MESSAGE_PATIENT: Phone_Number, Exact_Message_Text]\`.
- If the doctor gives an AMBIGUOUS clinical instruction (e.g., "Tell her to increase the dose" without naming medication or dosage):
  * DO NOT guess or invent medical advice.
  * Ask for clarification: "Doctor, please confirm the medication name and the exact new dose before I communicate the instruction to the patient."

==================================================
4. MISSING INFORMATION & CLARIFICATION
==================================================
- If critical information is missing to execute a task (e.g., "Call the patient and reschedule" without specifying which patient), ask ONE concise question:
  "Certainly, Doctor. Which patient should I reschedule?"
- If the task is clear, proceed immediately without redundant back-and-forth.

TODAY'S DATE: ${currentDateStr} (Indian Standard Time)

UPCOMING CLINIC APPOINTMENTS:
<SCHEDULE>
${scheduleContext}
</SCHEDULE>

==================================================
5. ACTION TAGS (TRIGGERING BACKEND EXECUTION)
==================================================
- **Message a Patient**:
  If the doctor asks you to send a message/notification to a patient:
  [MESSAGE_PATIENT: Phone_Number, Message_Text]
- **Delegate a Patient Follow-up / Confirmation Task**:
  If the doctor asks to contact/ask/check with a patient about an appointment or report:
  [DELEGATE_PATIENT_TASK: Patient_Name_Or_Phone, Action_Type, Target_Time, Instruction]
- **Cancel an Appointment**:
  If the doctor asks to cancel a specific appointment from <SCHEDULE>:
  [CANCEL_APPOINTMENT: Appointment_ID]
- **Reschedule an Appointment**:
  If the doctor asks to reschedule an existing appointment from <SCHEDULE>:
  [RESCHEDULE_APPOINTMENT: Appointment_ID, YYYY-MM-DD, Session]
- **Book a New Appointment**:
  If the doctor asks you to book a new appointment for a patient:
  [BOOK_NEW_APPOINTMENT: Full_Patient_Name, YYYY-MM-DD, HH:MM AM/PM, Phone_Number]
`;

      const prompt = `
System Instructions:
${systemPrompt}

Conversation History:
${conversationHistory.join("\n")}

Doctor's Message: "${incomingMessage}"

Write your professional, direct, concise administrative response directly to Doctor ${doctorName}:
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
  static async runProfileAgent(config: any, doctorId?: string) {
    try {
      let doctorName = "Our Specialist Doctor";
      let clinicName = "Our Clinic";
      let specialty = "Healthcare Services";

      if (doctorId) {
        try {
          const doc = await prisma.doctor.findUnique({
            where: { id: doctorId },
            select: { name: true, clinicName: true, specialty: true }
          });
          if (doc) {
            doctorName = formatDoctorDisplayName(doc.name);
            clinicName = doc.clinicName || clinicName;
            specialty = doc.specialty || specialty;
          }
        } catch (_) {}
      }

      const focusAreas = config?.focusAreas || `${specialty}, Preventive Care, Rehabilitation`;
      const brandVoice = config?.brandVoice || "Warm, empathetic, patient-centric healthcare advice";
      const customRules = config?.customRules || config?.instructions || "";
      const ctaType = config?.ctaType || "CALL";
      
      const ctaInstruction = ctaType === "CALL" 
        ? "Tap Call Now below to schedule your consultation" 
        : ctaType === "BOOK" 
          ? "Tap Book below to reserve your appointment" 
          : "Tap Learn More below for full treatment details";

      const prompt = `
        You are the "AI Content & Post Creator" agent for Google Business Profile.
        Generate an engaging, clinically sound Google Business Profile update post for:
        Doctor: ${doctorName}
        Clinic: ${clinicName}
        Medical Specialty: ${specialty}
        Clinical Focus: ${focusAreas}
        Brand Tone: ${brandVoice}
        ${customRules ? `Doctor Custom Guidelines: ${customRules}` : ""}
        Target Action Button: ${ctaType}
        
        CRITICAL GOOGLE POST COMPLIANCE & FORMATTING RULES:
        1. STRICTLY PLAIN TEXT ONLY: Absolutely DO NOT use markdown bolding (no **asterisks**), no headings (#), and no markdown bullet symbols. Everything must be pure readable text.
        2. ZERO PHONE NUMBERS: NEVER write any phone number in the body text (Google rejects posts for phone stuffing).
        3. ZERO STREET ADDRESSES: Do not type out the street address in the body text (Google Maps already displays the clinic location card).
        4. ETHICAL HEALTHCARE CONTENT: Share practical wellness insights, treatment benefits, or recovery tips. Never make absolute guarantees or miracle cure claims.
        5. CALL TO ACTION: Conclude the post by inviting the patient to take action: "${ctaInstruction}".
        
        Output JSON format only:
        {
          "title": "Short Clean Headline (under 60 chars)",
          "content": "Clean plain-text post body (100-140 words, NO asterisks, NO phone numbers)",
          "postType": "STANDARD",
          "ctaType": "${ctaType}"
        }
      `;

      const text = await generateWithFallback(prompt);
      let parsedResult: any = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsedResult = JSON.parse(jsonMatch[0]);
      } catch (e) {}

      let content = parsedResult?.content || "";
      if (!content) {
        content = `Are you dealing with persistent discomfort or seeking personalized medical guidance? At ${clinicName}, ${doctorName} provides compassionate, evidence-based care tailored to your specific wellness needs.\n\n${ctaInstruction}!`;
      }

      // Final sanity clean: strip markdown asterisks and phone numbers
      content = content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/g, "")
        .replace(/[ \t]+/g, " ")
        .trim();

      return {
        title: (parsedResult?.title || "Specialist Healthcare Consultation").replace(/\*\*/g, "").trim(),
        content,
        postType: "STANDARD",
        ctaType: parsedResult?.ctaType || ctaType || "CALL"
      };
    } catch (error) {
      console.error("Error in Profile Agent:", error);
      return {
        title: "Specialist Healthcare Consultation",
        content: "Schedule your consultation with our specialist doctors today to begin your personalized care journey.",
        postType: "STANDARD",
        ctaType: "CALL"
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
