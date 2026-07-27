import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";

export async function resolveGoogleReviewLink(doctorId: string): Promise<string> {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { clinicName: true, address: true }
    });
    const clinicName = doctor?.clinicName || "our clinic";

    // 1. Check GbpAccount insightsData or locationId
    const gbp = await prisma.gbpAccount.findFirst({ where: { doctorId } });
    let placeId = (gbp?.insightsData as any)?.placeId;

    // 2. Check latest AuditReport or AuditRequest
    if (!placeId) {
      const auditReport = await prisma.auditReport.findFirst({
        where: { businessName: { contains: clinicName, mode: "insensitive" } },
        select: { requestId: true }
      });
      if (auditReport) {
        const req = await prisma.auditRequest.findUnique({ where: { id: auditReport.requestId } });
        if (req?.placeId) placeId = req.placeId;
      }
    }

    // 3. Check Google Places API Text Search using clinicName + address
    if (!placeId) {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const query = encodeURIComponent(`${clinicName} ${doctor?.address || ""}`);
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`);
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results.length > 0) {
          placeId = data.results[0].place_id;
        }
      }
    }

    if (placeId) {
      return `https://search.google.com/local/writereview?placeid=${placeId}`;
    }

    return `https://google.com/search?q=${encodeURIComponent(clinicName)}`;
  } catch (e) {
    console.error("[resolveGoogleReviewLink] Error resolving review link:", e);
    return "https://google.com";
  }
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
          patient: true
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
          const defaultMessage = `Hi ${patient.firstName}, thank you for trusting ${doctor.clinicName || "our clinic"}. We truly care about your well-being and hope you are feeling better after your visit.\n\nWere you happy with your care? Simply reply *YES*.\nIf there is anything we could have done better, please reply *NO* so we can improve your care.`;
          const surveyMessage = doctor.reviewSurveyMessage || defaultMessage;
          const optOutMsg = "\n\n*(Reply STOP to opt out of automated messages)*";
          const finalMessage = surveyMessage + optOutMsg;

          const normalizedPhone = await whatsappManager.sendMessage(doctor.id, patient.phone, finalMessage);

          let conversation = await prisma.conversation.findUnique({
            where: { doctorId_patientPhone: { doctorId: doctor.id, patientPhone: normalizedPhone } }
          });
          
          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                doctorId: doctor.id,
                patientPhone: normalizedPhone,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientId: patient.id,
                status: "OPEN",
              }
            });
          }
          
          await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              direction: "OUTGOING",
              messageType: "text",
              content: finalMessage,
              senderName: "Clinic",
            }
          });
          
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() }
          });

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
      const defaultReply = `Hi ${patient.firstName}, thank you for choosing ${doctor.clinicName || "our clinic"}! 🌟\n\nIf you have 60 seconds, it would mean the world to our staff if you could share your experience on Google:\n${reviewLink}\n\nThank you so much!`;
      finalMessage = doctor.reviewGoogleInvitationMessage 
        ? doctor.reviewGoogleInvitationMessage.replace("{link}", reviewLink)
        : defaultReply;
    } else {
      const defaultMessage = `Hi ${patient.firstName}, thank you for trusting ${doctor.clinicName || "our clinic"}. We truly care about your well-being and hope you are feeling better after your visit.\n\nWere you happy with your care? Simply reply *YES*.\nIf there is anything we could have done better, please reply *NO* so we can improve your care.`;
      const surveyMessage = doctor.reviewSurveyMessage || defaultMessage;
      const optOutMsg = "\n\n*(Reply STOP to opt out of automated messages)*";
      finalMessage = surveyMessage + optOutMsg;
    }

    const normalizedPhone = await whatsappManager.sendMessage(doctorId, patient.phone, finalMessage);

    let conversation = await prisma.conversation.findUnique({
      where: { doctorId_patientPhone: { doctorId, patientPhone: normalizedPhone } }
    });
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          doctorId,
          patientPhone: normalizedPhone,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.id,
          status: "OPEN",
        }
      });
    }
    
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTGOING",
        messageType: "text",
        content: finalMessage,
        senderName: "Clinic",
      }
    });

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
