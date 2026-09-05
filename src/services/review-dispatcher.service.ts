import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";

export async function resolveGoogleReviewLink(doctorId: string): Promise<string> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { clinicName: true, address: true, city: true, googleReviewLink: true }
  });
  
  if (doctor?.googleReviewLink) {
    return doctor.googleReviewLink;
  }

  const clinicName = doctor?.clinicName || "";

  // 1. Check GbpAccount connected to THIS doctor
  const gbp = await prisma.gbpAccount.findFirst({ where: { doctorId } });
  
  if (gbp) {
    const insights = (gbp.insightsData as any) || {};
    
    // Check direct Google Review URI from GBP API
    if (insights.newReviewUri && typeof insights.newReviewUri === "string" && insights.newReviewUri.trim().length > 0) {
      return insights.newReviewUri.trim();
    }
    if (insights.googleReviewUrl && typeof insights.googleReviewUrl === "string" && insights.googleReviewUrl.trim().length > 0) {
      return insights.googleReviewUrl.trim();
    }
    if (insights.placeId && typeof insights.placeId === "string" && insights.placeId.trim().length > 0) {
      return `https://search.google.com/local/writereview?placeid=${insights.placeId.trim()}`;
    }
    if (insights.place_id && typeof insights.place_id === "string" && insights.place_id.trim().length > 0) {
      return `https://search.google.com/local/writereview?placeid=${insights.place_id.trim()}`;
    }
  }

  // 2. Check if doctor has a Google Places API place_id using clinicName + address
  if (clinicName) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const query = encodeURIComponent(`${clinicName} ${doctor?.address || ""} ${doctor?.city || ""}`.trim());
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`);
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results.length > 0 && data.results[0].place_id) {
          return `https://search.google.com/local/writereview?placeid=${data.results[0].place_id}`;
        }
      } catch (e) {
        console.warn("[resolveGoogleReviewLink] Google Places API search failed:", e);
      }
    }
  }

  // 3. If doctor has a GBP account record or clinicName, fallback to Google Search for THIS clinic
  if (gbp || (clinicName && clinicName !== "our clinic")) {
    return `https://www.google.com/search?q=${encodeURIComponent(clinicName + " " + (doctor?.city || ""))}`;
  }

  // 4. If doctor has NO GBP profile and NO clinic name configured
  throw new Error("Google Business Profile is not connected. Please connect your GBP profile in GBP Profile settings to send Google review requests.");
}

export class ReviewDispatcherService {
  /**
   * Evaluates recently completed appointments and sends review surveys
   * according to the configured delay and cooldown rules.
   */
  static async evaluateAppointments() {
    console.log("[ReviewDispatcherService] Evaluating appointments for review surveys...");
    
    // Find all doctors with review automation enabled
    const doctors = await prisma.doctor.findMany({
      where: { reviewAutomationEnabled: true },
      select: {
        id: true,
        reviewCooldownDays: true,
        reviewDelayMinutes: true,
        reviewSurveyMessage: true,
        clinicName: true,
      }
    });

    for (const doctor of doctors) {
      if (!whatsappManager.isConnected(doctor.id)) {
        continue;
      }

      const delayMinutes = doctor.reviewDelayMinutes || 45;
      const cooldownDays = doctor.reviewCooldownDays || 90;
      
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - delayMinutes);

      const eligibleAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          status: "COMPLETED",
          reviewStatus: "NOT_SENT",
          updatedAt: { lte: cutoffTime }
        },
        include: {
          patient: true,
          practitioner: true,
          doctor: { select: { name: true, clinicName: true } }
        }
      });

      for (const appointment of eligibleAppointments) {
        const patient = appointment.patient;
        
        // Cooldown check
        let isEligible = true;
        if (patient.lastReviewRequestedAt) {
          const daysSinceLastRequest = (new Date().getTime() - patient.lastReviewRequestedAt.getTime()) / (1000 * 3600 * 24);
          if (daysSinceLastRequest < cooldownDays) {
            isEligible = false;
          }
        }

        if (!isEligible) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reviewRequested: true }
          });
          continue;
        }

        // Send survey
        try {
          const rawDocName = appointment.practitioner?.name || appointment.doctor?.name || doctor.clinicName || "Doctor";
          const docName = rawDocName.startsWith("Dr.") ? rawDocName : `Dr. ${rawDocName}`;
          const clinicName = doctor.clinicName || `${docName}'s Clinic`;
          const isTele = appointment.type === "TELE_CONSULTATION";

          let defaultMessage = "";
          if (isTele) {
            defaultMessage = `Hi ${patient.firstName}, thank you for consulting with ${docName} at ${clinicName} online. We hope you had a smooth and helpful video consultation.\n\nWere you satisfied with your experience? Simply reply *YES*.\nIf there is anything we could have done better, please reply *NO* so we can improve.`;
          } else {
            defaultMessage = `Hi ${patient.firstName}, thank you for visiting ${clinicName} for your consultation with ${docName}. We hope you had a smooth and comfortable visit.\n\nWere you satisfied with your experience? Simply reply *YES*.\nIf there is anything we could have done better, please reply *NO* so we can improve.`;
          }

          let surveyMessage = defaultMessage;
          if (doctor.reviewSurveyMessage && doctor.reviewSurveyMessage.trim().length > 0) {
            surveyMessage = doctor.reviewSurveyMessage
              .replace(/\{firstName\}/g, patient.firstName || "")
              .replace(/\{doctorName\}/g, docName)
              .replace(/\{clinicName\}/g, clinicName);
          }

          const optOutMsg = "\n\n*(Reply STOP to opt out of automated messages)*";
          const finalMessage = surveyMessage + optOutMsg;

          // whatsappManager.sendMessage delivers the message and records Conversation/ChatMessage once with true timestamp
          await whatsappManager.sendMessage(doctor.id, patient.phone, finalMessage);

          // Update Status
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reviewStatus: "SURVEY_SENT", reviewRequested: true }
          });

          // Update Patient cooldown
          await prisma.patient.update({
            where: { id: patient.id },
            data: { lastReviewRequestedAt: new Date() }
          });
          
          console.log(`[ReviewDispatcherService] Sent survey to ${patient.phone} for appointment ${appointment.id}`);
        } catch (error) {
          console.error(`[ReviewDispatcherService] Failed to send survey for appointment ${appointment.id}:`, error);
        }
      }
    }
  }

  /**
   * Manual send review request or direct Google review link by staff
   */
  static async manualSendReviewRequest(
    patientId: string, 
    appointmentId: string, 
    doctorId: string, 
    overrideCooldown: boolean = false,
    requestType: "SURVEY" | "GOOGLE_REVIEW" = "SURVEY"
  ) {
    if (!whatsappManager.isConnected(doctorId)) {
      throw new Error("WhatsApp is not connected. Please connect your device in WhatsApp Settings to send review requests.");
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { clinicName: true, reviewCooldownDays: true, reviewSurveyMessage: true, reviewGoogleInvitationMessage: true }
    });
    if (!doctor) throw new Error("Doctor not found");

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error("Patient not found");
    if (!patient.phone) throw new Error("Patient has no phone number recorded.");
    
    if (!overrideCooldown && patient.lastReviewRequestedAt) {
      const cooldownDays = doctor.reviewCooldownDays || 90;
      const daysSinceLastRequest = (new Date().getTime() - patient.lastReviewRequestedAt.getTime()) / (1000 * 3600 * 24);
      if (daysSinceLastRequest < cooldownDays) {
        throw new Error(`Patient is within the ${cooldownDays}-day cooldown period.`);
      }
    }

    let finalMessage = "";

    if (requestType === "GOOGLE_REVIEW") {
      const reviewLink = await resolveGoogleReviewLink(doctorId);
      const defaultReply = `Hi ${patient.firstName}, we hope you had a wonderful experience with us. If you feel we took great care of you, sharing a quick review on Google helps other patients find the care they need:\n\n${reviewLink}`;
      finalMessage = doctor.reviewGoogleInvitationMessage 
        ? doctor.reviewGoogleInvitationMessage.replace("{link}", `\n\n${reviewLink}\n\n`)
        : defaultReply;
    } else {
      const defaultMessage = `Hi ${patient.firstName}, thank you for trusting ${doctor.clinicName || "our clinic"}. We truly care about your well-being and hope you are feeling better after your visit.\n\nWere you happy with your care? Simply reply *YES*.\nIf there is anything we could have done better, please reply *NO* so we can improve your care.`;
      const surveyMessage = doctor.reviewSurveyMessage || defaultMessage;
      const optOutMsg = "\n\n*(Reply STOP to opt out of automated messages)*";
      finalMessage = surveyMessage + optOutMsg;
    }

    // whatsappManager.sendMessage delivers the message and records Conversation/ChatMessage once with true timestamp
    await whatsappManager.sendMessage(doctorId, patient.phone, finalMessage);

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reviewStatus: requestType === "GOOGLE_REVIEW" ? "LINK_SENT" : "SURVEY_SENT", reviewRequested: true }
      });
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastReviewRequestedAt: new Date() }
    });

    return true;
  }
}
