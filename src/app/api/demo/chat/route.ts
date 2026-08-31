import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/services/ai-agents.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      specialty = "General Medicine", 
      doctorName = "Dr. Sharma", 
      clinicName = "City Health Clinic", 
      language = "Hinglish", 
      consultationFee = 800, 
      allowTeleConsultation = true, 
      teleConsultationFee = 1000 
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const lower = trimmedMsg.toLowerCase();

    // Fast deterministic responses for common demo prompts to deliver sub-second responses
    if (lower.includes("fee") || lower.includes("charge") || lower.includes("kitni") || lower.includes("cost") || lower.includes("price")) {
      return NextResponse.json({
        reply: `Namaste 🙏 ${doctorName}'s In-Clinic consultation fee is ₹${consultationFee}.${allowTeleConsultation ? ` For Online Video Consultation, the fee is ₹${teleConsultationFee}.` : ""}\n\nWould you like me to reserve a slot for you today or tomorrow?`
      });
    }

    if (lower.includes("video") || lower.includes("online") || lower.includes("tele")) {
      if (allowTeleConsultation) {
        return NextResponse.json({
          reply: `Yes! ${doctorName} offers Online Video Consultations (Fee: ₹${teleConsultationFee}) for patients who cannot visit in person. 🌐\n\nI can book your video slot right away. Please share your preferred day and time!`
        });
      } else {
        return NextResponse.json({
          reply: `Currently, ${doctorName} provides in-person clinical consultations only at ${clinicName} to ensure accurate physical examination. Would you like to book an in-clinic visit?`
        });
      }
    }

    if (lower.includes("report") || lower.includes("blood") || lower.includes("test") || lower.includes("biopsy")) {
      return NextResponse.json({
        reply: `Routine blood test results are usually ready within 24 hours, while specialized diagnostics (like biopsy or culture) take 3–5 working days. Once verified by ${doctorName}, our team will share a notification. How may I assist you with your appointment today?`
      });
    }

    if (lower.includes("timing") || lower.includes("time") || lower.includes("hours") || lower.includes("kab") || lower.includes("open")) {
      return NextResponse.json({
        reply: `${clinicName} is open Monday to Saturday from 09:00 AM – 01:00 PM and 05:00 PM – 08:30 PM. Would you like a morning or evening slot?`
      });
    }

    if (lower.includes("book") || lower.includes("appointment") || lower.includes("slot") || lower.includes("kal") || lower.includes("tomorrow") || lower.includes("aaj") || lower.includes("today")) {
      return NextResponse.json({
        reply: `Certainly! I have slots available with ${doctorName} (${specialty}):\n\n1️⃣ Tomorrow at 10:30 AM\n2️⃣ Tomorrow at 05:30 PM\n3️⃣ Tomorrow at 06:45 PM\n\nPlease let me know your preferred option along with the patient's name to confirm!`
      });
    }

    // Dynamic LLM fallback for creative custom queries
    const prompt = `You are the warm, polite, and autonomous 24/7 WhatsApp AI Receptionist for "${doctorName}" at "${clinicName}" (${specialty}).
Rules:
1. Speak concisely in ${language} (support English, Hindi, and natural Hinglish).
2. Answer patient queries with clinical empathy and warmth.
3. Doctor in-clinic fee is ₹${consultationFee}, tele-consultation fee is ₹${teleConsultationFee} (Tele-consult allowed: ${allowTeleConsultation ? "Yes" : "No"}).
4. Never provide direct medical diagnoses or drug prescriptions. Offer to book a consultation with ${doctorName}.
5. Keep response under 3-4 short WhatsApp message lines with helpful emojis.

Patient query: "${trimmedMsg}"
Reply:`;

    try {
      const reply = await generateWithFallback(prompt);
      return NextResponse.json({
        reply: reply || `Namaste! Thank you for contacting ${clinicName}. How may I help you with your appointment with ${doctorName}?`
      });
    } catch (llmErr) {
      return NextResponse.json({
        reply: `Namaste! Thank you for reaching out to ${clinicName}. ${doctorName} is available for consultations Monday to Saturday. Would you like to schedule an appointment?`
      });
    }
  } catch (error: any) {
    console.error("Demo chat error:", error);
    return NextResponse.json({ error: "Failed to process demo chat" }, { status: 500 });
  }
}
