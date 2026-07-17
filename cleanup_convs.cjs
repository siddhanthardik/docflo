const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany();
  for (const conv of convs) {
    let cleanPhone = conv.patientPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    if (cleanPhone !== conv.patientPhone) {
      console.log(`Updating ${conv.patientPhone} to ${cleanPhone}`);
      
      // Check if the target conversation already exists
      const existing = await prisma.conversation.findUnique({
        where: { doctorId_patientPhone: { doctorId: conv.doctorId, patientPhone: cleanPhone } }
      });
      
      if (existing) {
        // Move messages and delete old
        await prisma.chatMessage.updateMany({
          where: { conversationId: conv.id },
          data: { conversationId: existing.id }
        });
        await prisma.conversation.delete({ where: { id: conv.id } });
        console.log(`Merged ${conv.id} into ${existing.id}`);
      } else {
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { patientPhone: cleanPhone }
        });
        console.log(`Updated phone to ${cleanPhone}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
