import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";

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

      // Find appointments that are COMPLETED, have NOT_SENT reviewStatus, 
      // and their updatedAt is older than the cutoff time (meaning they have been completed for > delayMinutes)
      // Note: In a stricter environment we'd use a dedicated completedAt timestamp, but updatedAt suffices here 
      // because once COMPLETED, it usually doesn't get updated frequently.
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
          // If we don't send it because of cooldown, mark it as SKIPPED by updating reviewStatus to SURVEY_SENT 
          // (or a new SKIPPED status if we had one, but we'll use a standard approach - let's set it to SURVEY_SENT 
          // or just update reviewRequested=true to prevent infinite loop checking).
          // Actually, let's just mark it NOT_SENT and update the `updatedAt`? No, let's just log a skipped event and set reviewRequested=true so we skip it.
          // Wait, if it's skipped, it shouldn't show as SURVEY_SENT. 
          // Let's just update `reviewRequested: true` to flag that it was processed, even if skipped.
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reviewRequested: true } // Legacy field acts as processed flag for skipped ones
          });
          continue;
        }

        // Send survey
        try {
          const defaultMessage = `Hi ${patient.firstName}, thank you for trusting ${doctor.clinicName || "our clinic"} with your care today! We strive to provide the best possible experience.\n\nWere you happy with your visit? Simply reply *YES*.\nIf there's anything we could have done better, please reply *NO*.`;
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
            data: { reviewStatus: "SURVEY_SENT", reviewRequested: true } // populate legacy field too
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
   * Manual send review request by staff
   */
  static async manualSendReviewRequest(patientId: string, appointmentId: string, doctorId: string, overrideCooldown: boolean = false) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { clinicName: true, reviewCooldownDays: true, reviewSurveyMessage: true }
    });
    if (!doctor) throw new Error("Doctor not found");

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error("Patient not found");
    
    if (!overrideCooldown && patient.lastReviewRequestedAt) {
      const cooldownDays = doctor.reviewCooldownDays || 90;
      const daysSinceLastRequest = (new Date().getTime() - patient.lastReviewRequestedAt.getTime()) / (1000 * 3600 * 24);
      if (daysSinceLastRequest < cooldownDays) {
        throw new Error(`Patient is within the ${cooldownDays}-day cooldown period.`);
      }
    }

    const defaultMessage = `Hi ${patient.firstName}, thank you for trusting ${doctor.clinicName || "our clinic"} with your care today! We strive to provide the best possible experience.\n\nWere you happy with your visit? Simply reply *YES*.\nIf there's anything we could have done better, please reply *NO*.`;
    const surveyMessage = doctor.reviewSurveyMessage || defaultMessage;
    const optOutMsg = "\n\n*(Reply STOP to opt out of automated messages)*";
    const finalMessage = surveyMessage + optOutMsg;

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
        data: { reviewStatus: "SURVEY_SENT", reviewRequested: true }
      });
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastReviewRequestedAt: new Date() }
    });

    return true;
  }
}
