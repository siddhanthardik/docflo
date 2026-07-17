const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convLid = await prisma.conversation.findFirst({
    where: { patientPhone: "58759615357056" }
  });
  const convReal = await prisma.conversation.findFirst({
    where: { patientPhone: "917838033664" }
  });

  if (convLid && convReal) {
    await prisma.chatMessage.updateMany({
      where: { conversationId: convLid.id },
      data: { conversationId: convReal.id }
    });
    await prisma.conversation.delete({
      where: { id: convLid.id }
    });
    console.log("Successfully merged lid conversation into real conversation.");
  }
}

main().finally(() => prisma.$disconnect());
