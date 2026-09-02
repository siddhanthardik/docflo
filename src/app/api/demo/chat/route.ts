import { NextRequest, NextResponse } from "next/server";
import { AIAgentsService } from "@/services/ai-agents.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      specialty = "General Medicine", 
      doctorName = "Dr. Sharma", 
      clinicName = "City Health Clinic", 
      assistantName = "Mona",
      consultationFee = 800, 
      allowTeleConsultation = true, 
      teleConsultationFee = 1000,
      clinicTimings = "Mon-Sat: 10:00 AM - 1:00 PM & 5:00 PM - 8:30 PM",
      clinicPhone,
      conversationHistory = []
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const rawReply = await AIAgentsService.runDemoReceptionist(
      message.trim(),
      {
        doctorName,
        clinicName,
        specialty,
        assistantName,
        consultationFee,
        allowTeleConsultation,
        teleConsultationFee,
        clinicTimings,
        clinicPhone,
      },
      conversationHistory
    );

    const cleanReply = (rawReply || "")
      .replace(/\[(RESCHEDULE_APPOINTMENT|CANCEL_APPOINTMENT|CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT|BOOK_NEW_APPOINTMENT|MESSAGE_PATIENT|BOOK_APPOINTMENT|DELEGATE_PATIENT_TASK|CLARIFY_TASK)(?::.*?)?\]/gi, "")
      .trim();

    return NextResponse.json({
      reply: cleanReply || `Namaste! 🙏 I am ${assistantName}, 24/7 AI Receptionist for ${doctorName} at ${clinicName}. How may I help you with your appointment or visit today?`
    });
  } catch (error: any) {
    console.error("Demo chat error:", error);
    return NextResponse.json({ error: "Failed to process demo chat" }, { status: 500 });
  }
}
