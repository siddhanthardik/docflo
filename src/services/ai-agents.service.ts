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
  clinicPhone?: string
): string {
  const text = incomingMessage.trim();
  const textLower = text.toLowerCase();
  const docTitle = formatDoctorDisplayName(rawDoctorName);

  // ════ Indian Language Script Detection ═══════════════════════════════════
  const isDevanagari = /[\u0900-\u097F]/.test(text); // Hindi / Marathi
  const isTamil = /[\u0B80-\u0BFF]/.test(text);
  const isTelugu = /[\u0C00-\u0C7F]/.test(text);
  const isKannada = /[\u0C80-\u0CFF]/.test(text);
  const isMalayalam = /[\u0D00-\u0D7F]/.test(text);
  const isBengali = /[\u0980-\u09FF]/.test(text);
  const isGujarati = /[\u0A80-\u0AFF]/.test(text);
  const isPunjabi = /[\u0A00-\u0A7F]/.test(text);

  const isHinglish = !isDevanagari && !isTamil && !isTelugu && !isKannada && !isMalayalam && !isBengali && !isGujarati && !isPunjabi &&
    /\b(kya|kab|kahan|kaise|kitna|kitni|chahiye|milna|aana|hai|hain|bhi|ji|hlo|namaste|pranam|batao|bataiye|samay|fees)\b/i.test(textLower);
  
  // User explicitly asking for phone / human call
  const wantsCallOrHuman = /human|speak|call|phone|number|contact|talk|baat|phone\s*number/i.test(textLower);
  const phoneSuffix = (wantsCallOrHuman && clinicPhone && clinicPhone.trim().length > 3)
    ? `\n\n📞 Aap direct clinic reception par *${clinicPhone.trim()}* par bhi call kar sakte hain.`
    : (wantsCallOrHuman && clinicPhone)
    ? `\n\n📞 You can also reach our clinic reception directly at *${clinicPhone.trim()}*.`
    : "";

  // Clean fee string
  const cleanFee = consultationFee ? consultationFee.replace(/[^\d.,]/g, '').trim() : "";

  // ════ 1. TAMIL (தமிழ்) ════════════════════════════════════════════════════
  if (isTamil) {
    if (/வணக்கம்|ஹலோ|ஹாய்/.test(text) || text.length <= 4) {
      return `வணக்கம்! 🙏 நான் ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) வரவேற்பாளர்.\n\nஇன்று உங்களுக்கு அப்பாயின்ட்மென்ட் அல்லது கிளினிக் தகவலில் எவ்வாறு உதவ முடியும்?${phoneSuffix}`;
    }
    if (/நேரம்|டைம்|எப்போது|opd/.test(text)) {
      return `${docTitle} கிளினிக்கில் ஆலோசனைக்கு கிடைக்கும் நேரம்:\n🕒 *${clinicTimings}*\n\nஇன்று அல்லது நாளைக்கு அப்பாயின்ட்மென்ட் முன்பதிவு செய்ய விரும்புகிறீர்களா?${phoneSuffix}`;
    }
    if (/கட்டணம்|பீஸ்|விலை|செலவு/.test(text)) {
      const feeText = cleanFee ? `ஆலோசனைக் கட்டணம் *₹${cleanFee}*` : "ஆலோசனைக் கட்டண விவரங்கள் கிளினிக்கில் தெரிவிக்கப்படும்";
      return `${docTitle} (${specialty}) ${feeText}.\n\nஇன்று அல்லது நாளைக்கு அப்பாயின்ட்மென்ட் முன்பதிவு செய்ய விரும்புகிறீர்களா?${phoneSuffix}`;
    }
    return `வணக்கம்! ${clinicName} தொடர்பு கொண்டதற்கு நன்றி. நான் ${assistantName}. ${docTitle} (${specialty}) அவர்களுடன் அப்பாயின்ட்மென்ட் முன்பதிவு செய்ய விரும்புகிறீர்களா?${phoneSuffix}`;
  }

  // ════ 2. TELUGU (తెలుగు) ═════════════════════════════════════════════════
  if (isTelugu) {
    if (/నమస్కారం|హలో|హాయ్/.test(text) || text.length <= 4) {
      return `నమస్కారం! 🙏 నేను ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) రిసెప్షనిస్ట్.\n\nనేను మీకు అపాయింట్‌మెంట్ లేదా క్లినిక్ వివరాలలో ఎలా సహాయపడగలను?${phoneSuffix}`;
    }
    if (/సమయం|టైమింగ్|ఎప్పుడు|opd/.test(text)) {
      return `${docTitle} క్లినిక్‌లో సంప్రదింపులకు అందుబాటులో ఉండే సమయం:\n🕒 *${clinicTimings}*\n\nమీరు ఈరోజు లేదా రేపటికి అపాయింట్‌మెంట్ బుక్ చేయాలనుకుంటున్నారా?${phoneSuffix}`;
    }
    if (/ఫీజు|ఖర్చు|ధర/.test(text)) {
      const feeText = cleanFee ? `కన్సల్టేషన్ ఫీజు *₹${cleanFee}*` : "ఫీజు వివరాలు క్లినిక్‌లో తెలియజేయబడతాయి";
      return `${docTitle} (${specialty}) ${feeText}.\n\nమీరు స్లాట్ బుక్ చేయాలనుకుంటున్నారా?${phoneSuffix}`;
    }
    return `నమస్కారం! ${clinicName} ను సంప్రదించినందుకు ధన్యవాదాలు. నేను ${assistantName}. ${docTitle} తో అపాయింట్‌మెంట్ బుక్ చేయడానికి నేను మీకు సహాయపడగలను.${phoneSuffix}`;
  }

  // ════ 3. KANNADA (ಕನ್ನಡ) ═════════════════════════════════════════════════
  if (isKannada) {
    if (/ನಮಸ್ಕಾರ|ಹಲೋ|ಹಾಯ್/.test(text) || text.length <= 4) {
      return `ನಮಸ್ಕಾರ! 🙏 ನಾನು ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) ರಿಸೆಪ್ಷನಿಸ್ಟ್.\n\nಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಅಥವಾ ಕ್ಲಿನಿಕ್ ಮಾಹಿತಿಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?${phoneSuffix}`;
    }
    if (/ಸಮಯ|ಟೈಮಿಂಗ್|ಯಾವಾಗ|opd/.test(text)) {
      return `${docTitle} ಕ್ಲಿನಿಕ್‌ನಲ್ಲಿ ಲಭ್ಯವಿರುವ ಸಮಯ:\n🕒 *${clinicTimings}*\n\nನೀವು ಇಂದು ಅಥವಾ ನಾಳೆಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ಬಯಸುವಿರಾ?${phoneSuffix}`;
    }
    return `ನಮಸ್ಕಾರ! ${clinicName} ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ${assistantName}. ${docTitle} ಅವರೊಂದಿಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.${phoneSuffix}`;
  }

  // ════ 4. MALAYALAM (മലയാളം) ═════════════════════════════════════════════
  if (isMalayalam) {
    if (/നമസ്കാരം|ഹലോ|ഹായ്/.test(text) || text.length <= 4) {
      return `നമസ്കാരം! 🙏 ഞാൻ ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) റിസപ്ഷനിസ്റ്റ്.\n\nഅപ്പോയിന്റ്മെന്റിനോ ക്ലിനിക്ക് വിവരങ്ങൾക്കോ ഞാൻ എങ്ങനെ സഹായിക്കണം?${phoneSuffix}`;
    }
    if (/സമയം|ടൈം|എപ്പോൾ|opd/.test(text)) {
      return `${docTitle} ക്ലിനിക്കിൽ ലഭ്യമാകുന്ന സമയം:\n🕒 *${clinicTimings}*\n\nഇന്നോ നാളെയോ അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?${phoneSuffix}`;
    }
    return `നമസ്കാരം! ${clinicName} ലേക്ക് ബന്ധപ്പെട്ടതിന് നന്ദി. ഞാൻ ${assistantName}. ${docTitle} ന് അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യാൻ സഹായിക്കാം.${phoneSuffix}`;
  }

  // ════ 5. BENGALI (বাংলা) ═════════════════════════════════════════════════
  if (isBengali) {
    if (/নমস্কার|হ্যালো|হাই/.test(text) || text.length <= 4) {
      return `নমস্কার! 🙏 আমি ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) এর রিসেপশনিস্ট।\n\nআজ আমি আপনাকে অ্যাপয়েন্টমেন্ট বা ক্লিনিক সংক্রান্ত তথ্যে কীভাবে সাহায্য করতে পারি?${phoneSuffix}`;
    }
    if (/সময়|টাইম|কখন|opd/.test(text)) {
      return `${docTitle} ক্লিনিকে পরামর্শের জন্য উপলব্ধ সময়:\n🕒 *${clinicTimings}*\n\nআপনি কি আজ বা আগামীকালের জন্য অ্যাপয়েন্টমেন্ট বুক করতে চান?${phoneSuffix}`;
    }
    return `নমস্কার! ${clinicName} এ যোগাযোগ করার জন্য ধন্যবাদ। আমি ${assistantName}, ${docTitle} এর সাথে অ্যাপয়েন্টমেন্ট বুক করতে সাহায্য করতে পারি।${phoneSuffix}`;
  }

  // ════ 6. GUJARATI (ગુજરાતી) ═════════════════════════════════════════════
  if (isGujarati) {
    if (/નમસ્તે|હેલો|હાય/.test(text) || text.length <= 4) {
      return `નમસ્તે! 🙏 હું ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) ના રિસેપ્શનિસ્ટ છું.\n\nઆજે એપોઇન્ટમેન્ટ અથવા ક્લિનિકની માહિતીમાં હું તમારી કેવી રીતે મદદ કરી શકું?${phoneSuffix}`;
    }
    if (/સમય|ટાઇમિંગ|ક્યારે|opd/.test(text)) {
      return `${docTitle} ક્લિનિકમાં પરામર્શ માટે ઉપલબ્ધ સમય:\n🕒 *${clinicTimings}*\n\nશું તમે આજે અથવા આવતીકાલ માટે એપોઇન્ટમેન્ટ બુક કરવા માંગો છો?${phoneSuffix}`;
    }
    return `નમસ્તે! ${clinicName} નો સંપર્ક કરવા બદલ આભાર. હું ${assistantName}, ${docTitle} સાથે એપોઇન્ટમેન્ટ બુક કરવામાં તમારી સહાય કરી શકું છું.${phoneSuffix}`;
  }

  // ════ 7. PUNJABI (ਪੰਜਾਬੀ) ═══════════════════════════════════════════════
  if (isPunjabi) {
    if (/ਸਤਿ\s*ਸ੍ਰੀ\s*ਅਕਾਲ|ਹੈਲੋ|ਹਾਏ/.test(text) || text.length <= 4) {
      return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! 🙏 ਮੈਂ ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) ਤੋਂ ਰਿਸੈਪਸ਼ਨਿਸਟ ਬੋਲ ਰਹੀ ਹਾਂ।\n\nਮੈਂ ਅੱਜ ਅਪਾਇੰਟਮੈਂਟ ਜਾਂ ਕਲੀਨਿਕ ਸੰਬੰਧੀ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?${phoneSuffix}`;
    }
    if (/ਸਮਾਂ|ਟਾਈਮ|ਕਦੋਂ|opd/.test(text)) {
      return `${docTitle} ਕਲੀਨਿਕ ਵਿੱਚ ਉਪਲਬਧ ਸਮਾਂ:\n🕒 *${clinicTimings}*\n\nਕੀ ਤੁਸੀਂ ਅੱਜ ਜਾਂ ਕੱਲ੍ਹ ਲਈ ਅਪਾਇੰਟਮੈਂਟ ਬੁੱਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?${phoneSuffix}`;
    }
    return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ${clinicName} ਨਾਲ ਸੰਪਰਕ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ਮੈਂ ${assistantName}, ${docTitle} ਨਾਲ ਅਪਾਇੰਟਮੈਂਟ ਬੁੱਕ ਕਰਨ ਲਈ ਹਾਜ਼ਰ ਹਾਂ।${phoneSuffix}`;
  }

  // ════ 8. HINDI / MARATHI SCRIPT (हिंदी / मराठी) ═════════════════════════
  if (isDevanagari) {
    if (/^(नमस्ते|प्रणाम|हेलो|हाय|हैलो)/.test(text) || text.length <= 4) {
      return `नमस्ते! 🙏 मैं ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) से बोल रही हूँ।\n\nमैं आज अपॉइंटमेंट या क्लिनिक जानकारी में आपकी किस प्रकार सहायता कर सकती हूँ?${phoneSuffix}`;
    }
    if (/अपॉइंटमेंट|बुक|मिलना|समय|टाइम|उपलब्ध|दिखाना|कल|आज/.test(text)) {
      return `${docTitle} क्लिनिक में परामर्श (OPD) के लिए उपलब्ध हैं:\n🕒 *${clinicTimings}*\n\nक्या आप *आज* या *कल* के लिए अपॉइंटमेंट बुक करना चाहेंगे? कृपया अपना नाम और पसंदीदा समय बताएं।${phoneSuffix}`;
    }
    if (/फीस|शुल्क|खर्च|चार्ज|रुपये/.test(text)) {
      const feeText = cleanFee ? `परामर्श शुल्क *₹${cleanFee}* है` : "परामर्श शुल्क की जानकारी क्लिनिक पर दी जाती है";
      return `${docTitle} (${specialty}) का ${feeText}।\n\nक्या आप आज या कल के लिए परामर्श स्लॉट बुक करना चाहेंगे?${phoneSuffix}`;
    }
    if (/पता|कहाँ|लोकेशन|एड्रेस|दिशा|रास्ता/.test(text)) {
      if (clinicAddress) {
        return `हमारे क्लिनिक का पता:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD समय: *${clinicTimings}*\nक्या आप आज या कल आना चाहेंगे?${phoneSuffix}`;
      }
      return `हमारा क्लिनिक *${clinicName}* में स्थित है। सटीक पते के लिए कृपया क्लिनिक पर संपर्क करें।${phoneSuffix}`;
    }
    return `नमस्ते! *${clinicName}* में संपर्क करने के लिए धन्यवाद। मैं ${assistantName}, ${docTitle} (${specialty}) के साथ अपॉइंटमेंट बुक करने या क्लिनिक जानकारी के लिए उपलब्ध हूँ। क्या आप आज या कल का स्लॉट बुक करना चाहेंगे?${phoneSuffix}`;
  }

  // ════ 2. HINGLISH ══════════════════════════════════════════════════════════
  if (isHinglish) {
    if (/^(hi|hello|hey|namaste|pranam|hlo|helo|hii+)\b/i.test(textLower) || textLower.length <= 4) {
      return `Namaste! 🙏 Main ${assistantName}, *${clinicName}* (${docTitle} · ${specialty}) se bol rahi hoon.\n\nMain aapki appointment ya clinic se judi kis jankari me madad kar sakti hoon?${phoneSuffix}`;
    }
    if (/timing|samay|kab|time|opd|hours|khula|schedule/i.test(textLower)) {
      return `${docTitle} clinic me OPD consultations ke liye uplabdh hain:\n🕒 *${clinicTimings}*\n\nKya aap *aaj* ya *kal* ke liye appointment schedule karna chahenge?${phoneSuffix}`;
    }
    if (/appointment|book|visit|consult|slot|milna|dikhana|aana/i.test(textLower)) {
      return `${docTitle} (${specialty}) clinic me uplabdh hain:\n🕒 *${clinicTimings}*\n\nAppointment ke liye kripya apna **Naam**, **Date** aur **Morning ya Evening time** share karein. Main turant slot confirm kar dungi!${phoneSuffix}`;
    }
    if (/fee|charge|cost|price|kitna|kitni|paisa|rupee|rate/i.test(textLower)) {
      const feeText = cleanFee ? `Consultation fees *₹${cleanFee}* hai` : "Consultation fees ki details clinic par consultation ke samay di jaati hain";
      return `${docTitle} (${specialty}) ki ${feeText}.\n\nKya aap aaj ya kal ke liye slot book karna chahenge?${phoneSuffix}`;
    }
    if (/address|location|kahan|kaha|rasta|directions|map/i.test(textLower)) {
      if (clinicAddress) {
        return `Clinic ka address hai:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\nOPD Timings: *${clinicTimings}*\nKya aap aaj visit plan kar rahe hain?${phoneSuffix}`;
      }
      return `Hamara clinic *${clinicName}* par sthit hai. Exact address aur landmarks ke liye aap clinic reception par call kar sakte hain.${phoneSuffix}`;
    }
    return `Hello ji! *${clinicName}* me sampark karne ke liye dhanyawad. Main ${assistantName}, ${docTitle} (${specialty}) ke sath appointment book karne ke liye yahan hoon. Kya aap aaj ya kal visit karna chahenge?${phoneSuffix}`;
  }

  // ════ 3. ENGLISH (Professional, Warm & Human) ════════════════════════════
  // 3.1. Greetings (Hi, Hello, Good morning, etc.)
  if (/^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|hola|hii+|hl|hlo|helo)\b/i.test(textLower) || textLower === "hi" || textLower === "hello" || textLower === "hl" || textLower === "hii") {
    return `Hello! Namaste 🙏 I am ${assistantName}, receptionist at *${clinicName}* (${docTitle} · ${specialty}).\n\nHow may I assist you with an appointment or clinic inquiry today?${phoneSuffix}`;
  }

  // 3.2. Timings & OPD Hours
  if (/timing|hours|schedule|time|open|when\s*is|opd/i.test(textLower)) {
    return `${docTitle} is available for clinic consultations during OPD hours:\n🕒 *${clinicTimings}*\n\nWould you like to schedule an appointment for *today* or *tomorrow*? Please share your preferred time and patient name.${phoneSuffix}`;
  }

  // 3.3. Appointment Booking / Schedule
  if (/appointment|book|visit|consult|slot|schedule|available|doctor|reserve/i.test(textLower)) {
    return `${docTitle} is available during OPD hours:\n🕒 *${clinicTimings}*\n\nTo reserve your slot, please reply with your **Full Name**, preferred **Date**, and **Morning or Evening session**. I will be happy to confirm it for you!${phoneSuffix}`;
  }

  // 3.4. Fees & Pricing
  if (/fee|charge|cost|price|how\s*much|rate/i.test(textLower)) {
    const feeText = cleanFee ? `Consultation fee is *₹${cleanFee}*` : "Consultation fee details are shared directly at the clinic during your visit";
    return `${feeText} for ${docTitle} (${specialty}).\n\nWould you like to reserve a consultation slot for today or tomorrow?${phoneSuffix}`;
  }

  // 3.5. Address, Location & Directions
  if (/address|location|where|directions|map|how\s*to\s*reach|find/i.test(textLower)) {
    if (clinicAddress) {
      return `Our clinic address is:\n📍 *${clinicAddress}*${clinicMapsUri ? `\n🗺️ Google Maps: ${clinicMapsUri}` : ""}\n\n${docTitle} is available during OPD hours (${clinicTimings}).\n\nWould you like to schedule a visit?${phoneSuffix}`;
    }
    return `Our clinic is located at *${clinicName}*. For exact street directions or landmark guidance, please feel free to call our reception.${phoneSuffix}`;
  }

  // 3.6. Symptoms / Health Concern
  if (/fever|cough|pain|cold|vomit|headache|fracture|knee|baby|child|skin|teeth|allergy|injury|treatment|sick|ill/i.test(textLower)) {
    return `Thank you for sharing your concern. For proper clinical assessment and personalized care, we recommend an in-person OPD consultation with ${docTitle} (${specialty}).\n\nOPD Timings: *${clinicTimings}*\nWould you like to book a slot for today or tomorrow?${phoneSuffix}`;
  }

  // 3.7. Default Warm Fallback
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
