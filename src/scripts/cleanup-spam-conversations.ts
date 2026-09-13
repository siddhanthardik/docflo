import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Scanning for ghost WhatsApp channel & spam conversations...");

  // Find conversations with 18-digit IDs, newsletter JIDs, or invalid phone numbers
  const spamConversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { patientPhone: { startsWith: "120363" } },
        { patientPhone: { contains: "newsletter" } },
        { patientPhone: { contains: "@" } },
        { patientPhone: { contains: "broadcast" } },
      ],
    },
    select: {
      id: true,
      doctorId: true,
      patientPhone: true,
      patientName: true,
      _count: {
        select: { messages: true },
      },
    },
  });

  if (spamConversations.length === 0) {
    console.log("✅ No ghost channel or spam conversations found.");
    return;
  }

  console.log(`Found ${spamConversations.length} ghost conversations to clean up:`);
  for (const c of spamConversations) {
    console.log(`  - [${c.id}] ${c.patientName} (${c.patientPhone}) - ${c._count.messages} messages`);
  }

  const conversationIds = spamConversations.map((c) => c.id);

  // 1. Delete associated chat messages
  const deletedMessages = await prisma.chatMessage.deleteMany({
    where: { conversationId: { in: conversationIds } },
  });
  console.log(`🗑️ Deleted ${deletedMessages.count} associated chat messages.`);

  // 2. Delete conversations
  const deletedConversations = await prisma.conversation.deleteMany({
    where: { id: { in: conversationIds } },
  });
  console.log(`🗑️ Deleted ${deletedConversations.count} ghost channel conversations.`);

  console.log("✨ Clean-up completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
