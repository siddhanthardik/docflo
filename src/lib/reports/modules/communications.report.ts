import { prisma } from "@/lib/prisma";

export async function generateCommunicationReport(doctorId: string, start: Date, end: Date) {
  // We need to group by direction and senderName
  const messageGroups = await prisma.chatMessage.groupBy({
    by: ['direction', 'senderName'],
    where: {
      createdAt: { gte: start, lte: end },
      conversation: { doctorId }
    },
    _count: {
      id: true
    }
  });

  let totalMessages = 0;
  let incomingMessages = 0;
  let outgoingMessages = 0;
  let aiHandledMessages = 0;

  for (const group of messageGroups) {
    const count = group._count.id;
    totalMessages += count;

    if (group.direction === "INCOMING") {
      incomingMessages += count;
    } else if (group.direction === "OUTGOING") {
      outgoingMessages += count;
    }

    if (group.senderName === "AI Assistant") {
      aiHandledMessages += count;
    }
  }

  // Assuming 2 minutes saved per AI handled message
  const aiHoursSaved = (aiHandledMessages * 2) / 60;

  return {
    totalMessages,
    incomingMessages,
    outgoingMessages,
    aiHandledMessages,
    aiHoursSaved
  };
}
