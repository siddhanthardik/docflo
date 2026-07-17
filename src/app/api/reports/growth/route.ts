import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    // 1. Patient CRM Stats
    const patients = await prisma.patient.findMany({
      where: { doctorId, createdAt: { gte: start, lte: end } },
      select: { patientType: true },
    });
    const totalNewPatients = patients.length;
    const leadsCount = patients.filter(p => p.patientType === "LEAD").length;
    const activeCount = patients.filter(p => p.patientType === "ACTIVE").length;
    const inactiveCount = patients.filter(p => p.patientType === "INACTIVE").length;
    const lostCount = patients.filter(p => p.patientType === "LOST").length;

    // 2. Appointment Stats
    const appointments = await prisma.appointment.findMany({
      where: { doctorId, date: { gte: start, lte: end } },
      select: { status: true, date: true, reviewRequested: true },
    });
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === "SCHEDULED").length;
    const completedAppointments = appointments.filter(a => a.status === "COMPLETED").length;
    const cancelledAppointments = appointments.filter(a => a.status === "CANCELLED").length;
    const noShowAppointments = appointments.filter(a => a.status === "NO_SHOW").length;
    const reviewRequestsSent = appointments.filter(a => a.reviewRequested === true).length;

    const dailyAppointments = appointments.map((apt: { date: Date }) => ({
      date: apt.date.toISOString().split("T")[0],
    }));

    // 3. AI & Communication Stats
    const chatMessages = await prisma.chatMessage.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        conversation: { doctorId }
      },
      select: { direction: true, senderName: true }
    });
    const totalMessages = chatMessages.length;
    const incomingMessages = chatMessages.filter(m => m.direction === "INCOMING").length;
    const outgoingMessages = chatMessages.filter(m => m.direction === "OUTGOING").length;
    const aiHandledMessages = chatMessages.filter(m => m.senderName === "AI Assistant").length;
    
    // Assuming 2 minutes saved per AI handled message
    const aiHoursSaved = (aiHandledMessages * 2) / 60;

    // 4. Reputation & GBP Stats
    const reviews = await prisma.review.findMany({
      where: { doctorId, reviewDate: { gte: start, lte: end } },
      select: { rating: true },
    });
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
        : null;

    let gbpData = null;
    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: { insightsData: true },
    });
    if (gbpAccount?.insightsData) {
      const insights = gbpAccount.insightsData as any;
      gbpData = {
        totalViews: insights.totalViews || 0,
        totalSearches: insights.totalSearches || 0,
        phoneCalls: insights.phoneCalls || 0,
        directionRequests: insights.directionRequests || 0,
      };
    }

    return NextResponse.json({
      // CRM
      totalNewPatients,
      patientFunnel: {
        leads: leadsCount,
        active: activeCount,
        inactive: inactiveCount,
        lost: lostCount
      },
      // Appointments
      totalAppointments,
      appointmentOutcomes: {
        scheduled: scheduledAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        noShow: noShowAppointments
      },
      dailyAppointments,
      // Communications & AI
      totalMessages,
      incomingMessages,
      outgoingMessages,
      aiHandledMessages,
      aiHoursSaved,
      reviewRequestsSent,
      // Reputation
      reviewCount,
      avgRating,
      gbpData,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}