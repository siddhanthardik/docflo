const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({ 
    select: { id: true, patientPhone: true, patientName: true, messages: { select: { id: true } } } 
  });
  console.log(JSON.stringify(convs, null, 2));

  // If there are duplicate conversations for the same patient, we should merge them.
  // Group by doctorId and patientId (or something similar)
  // Let's just find exactly 917838033664 and any other duplicates that might be there.
  
  const allConvs = await prisma.conversation.findMany();
  
  // Group by doctorId + patientId
  const groups = {};
  for (const c of allConvs) {
    if (!c.patientId) continue;
    const key = c.doctorId + "_" + c.patientId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  
  for (const key in groups) {
    const list = groups[key];
    if (list.length > 1) {
      console.log(`Found duplicates for ${key}:`, list.map(c => c.patientPhone));
      // Keep the one with the correct 91 prefix if possible, or just the first one.
      const primary = list.find(c => c.patientPhone.startsWith('91')) || list[0];
      for (const c of list) {
        if (c.id !== primary.id) {
          console.log(`Merging ${c.id} (${c.patientPhone}) into ${primary.id} (${primary.patientPhone})`);
          await prisma.chatMessage.updateMany({
            where: { conversationId: c.id },
            data: { conversationId: primary.id }
          });
          await prisma.conversation.delete({
            where: { id: c.id }
          });
        }
      }
    }
  }

}

main().finally(() => prisma.$disconnect());
