import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "./whatsapp.service";

export class ReminderService {
  async sendAppointmentReminders() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

      // Find all active doctors with WhatsApp configured
      const doctors = await prisma.doctor.findMany({
        where: {
          whatsappConfig: {
            isActive: true,
          },
        },
        include: {
          whatsappConfig: true,
        },
      });

      for (const doctor of doctors) {
        if (!doctor.whatsappConfig) continue;

        const whatsappService = new WhatsAppService(
          doctor.whatsappConfig.accessToken!,
          doctor.whatsappConfig.phoneNumberId!,
          doctor.id
        );

        // Find appointments in the next 24 hours that haven't been reminded
        const upcomingAppointments = await prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            status: "SCHEDULED",
            reminderSent: false,
            date: {
              gte: now,
              lte: in24Hours,
            },
          },
          include: {
            patient: true,
          },
        });

        for (const appointment of upcomingAppointments) {
          const appointmentTime = new Date(appointment.startTime);
          const hoursUntilAppointment =
            (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

          // Send 24-hour reminder
          if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 2) {
            await whatsappService.sendTemplateMessage(
              appointment.patient.phone,
              "appointment_reminder_24hr",
              "en",
              [
                appointment.patient.firstName,
                doctor.name,
                appointmentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              ]
            );

            // Mark as reminded
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { reminderSent: true },
            });
          }

          // Send 1-hour reminder
          if (hoursUntilAppointment <= 1 && hoursUntilAppointment > 0) {
            await whatsappService.sendTemplateMessage(
              appointment.patient.phone,
              "appointment_reminder_1hr",
              "en",
              [
                appointment.patient.firstName,
                doctor.clinicName || "our clinic",
              ]
            );
          }
        }
      }

      return { success: true, message: "Reminders sent successfully" };
    } catch (error) {
      console.error("Error sending reminders:", error);
      throw error;
    }
  }

  async sendReviewRequest(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          doctor: {
            include: {
              whatsappConfig: true,
            },
          },
        },
      });

      if (
        !appointment ||
        !appointment.doctor.whatsappConfig?.isActive ||
        appointment.reviewRequested
      ) {
        return;
      }

      const whatsappService = new WhatsAppService(
        appointment.doctor.whatsappConfig.accessToken!,
        appointment.doctor.whatsappConfig.phoneNumberId!,
        appointment.doctorId
      );

      // Get Google review link
      const gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId: appointment.doctorId },
      });

      let reviewLink = "https://g.page/r/yourbusiness"; // Fallback
      if (gbpAccount?.locationName) {
        // Extract place ID from location name
        const placeId = gbpAccount.locationName.split("/").pop();
        reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;
      }

      await whatsappService.sendTemplateMessage(
        appointment.patient.phone,
        "review_request",
        "en",
        [appointment.patient.firstName, appointment.doctor.clinicName || "us", reviewLink]
      );

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reviewRequested: true },
      });

      return { success: true, message: "Review request sent" };
    } catch (error) {
      console.error("Error sending review request:", error);
      throw error;
    }
  }
}