import { prisma } from "@/lib/prisma";

export async function getValidGCalAccessToken(doctorId: string): Promise<string | null> {
  const doctor: any = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor?.gcalAccessToken && !doctor?.gcalRefreshToken) {
    return null;
  }

  if (doctor.gcalAccessToken) {
    return doctor.gcalAccessToken;
  }

  if (doctor.gcalRefreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in env for GCal refresh");
      return null;
    }

    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: doctor.gcalRefreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        await prisma.doctor.update({
          where: { id: doctorId },
          data: { gcalAccessToken: data.access_token } as any,
        });
        return data.access_token;
      }
    } catch (err) {
      console.error("Error refreshing Google Calendar access token:", err);
    }
  }

  return null;
}

export async function syncAppointmentToGCal(appointmentId: string): Promise<boolean> {
  try {
    const appointment: any = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) return false;

    const accessToken = await getValidGCalAccessToken(appointment.doctorId);
    if (!accessToken) {
      return false;
    }

    const patientName = appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim()
      : "Patient";

    const summary = `Clinic Appointment: ${patientName}`;
    const description = `Patient: ${patientName}\nPhone: ${appointment.patient?.phone || "N/A"}\nReason: ${appointment.reason || "General Consultation"}\nStatus: ${appointment.status}\nNotes: ${appointment.notes || "None"}`;

    const eventPayload = {
      summary,
      description,
      start: {
        dateTime: new Date(appointment.startTime).toISOString(),
      },
      end: {
        dateTime: new Date(appointment.endTime).toISOString(),
      },
      reminders: {
        useDefault: true,
      },
    };

    let res: Response;
    if (appointment.gcalEventId) {
      res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.gcalEventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        }
      );
    } else {
      res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        }
      );
    }

    if (res.ok) {
      const gcalEvent = await res.json();
      if (gcalEvent.id && !appointment.gcalEventId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { gcalEventId: gcalEvent.id } as any,
        });
      }
      console.log(`[GCAL SYNC SUCCESS] Appointment ${appointmentId} synced to GCal Event ID: ${gcalEvent.id}`);
      return true;
    } else {
      const errData = await res.json();
      console.error("[GCAL SYNC ERROR]", res.status, errData);
    }
  } catch (error) {
    console.error("Error in syncAppointmentToGCal:", error);
  }
  return false;
}

export async function deleteGCalAppointmentEvent(appointmentId: string): Promise<boolean> {
  try {
    const appointment: any = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || !appointment.gcalEventId) return false;

    const accessToken = await getValidGCalAccessToken(appointment.doctorId);
    if (!accessToken) return false;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.gcalEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.ok || res.status === 404) {
      console.log(`[GCAL DELETE SUCCESS] Event ${appointment.gcalEventId} removed`);
      return true;
    }
  } catch (error) {
    console.error("Error in deleteGCalAppointmentEvent:", error);
  }
  return false;
}
