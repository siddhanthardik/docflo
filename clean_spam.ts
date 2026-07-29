import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const spamKeywords = ["balde vs gavi", "keep playing", "ow.ly", "youtu.be"];
  
  for (const keyword of spamKeywords) {
    const messages = await prisma.chatMessage.findMany({
      where: {
        content: { contains: keyword, mode: "insensitive" }
      }
    });
    
    for (const msg of messages) {
      await prisma.chatMessage.deleteMany({
        where: { conversationId: msg.conversationId }
      });
      await prisma.conversation.delete({
        where: { id: msg.conversationId }
      });
      console.log(`Deleted conversation ${msg.conversationId} due to spam`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
