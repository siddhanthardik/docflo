import { prisma } from "../src/lib/prisma";

async function sanitizeUnregisteredConversations() {
  console.log("🔍 Checking conversations for unregistered contacts with public pushNames...");

  // Find all conversations where patientId IS NULL
  const conversations = await prisma.conversation.findMany({
    where: {
      patientId: null,
    },
    select: {
      id: true,
      doctorId: true,
      patientName: true,
      patientPhone: true,
    }
  });

  console.log(`Found ${conversations.length} conversation(s) without a linked patient.`);

  let updatedCount = 0;

  for (const conv of conversations) {
    const rawName = conv.patientName || "";
    const isStaffOrDoctor = rawName.toLowerCase().includes("doctor") || rawName.toLowerCase().includes("staff");
    if (isStaffOrDoctor) continue;

    const formattedPhone = conv.patientPhone.startsWith("+") ? conv.patientPhone : `+${conv.patientPhone}`;

    // If patientName contains a pushName (like "Samridhi Hardik", "Ak", "Rocky kumar") rather than the phone number
    if (rawName !== formattedPhone) {
      console.log(`🧼 Sanitizing Conversation [${conv.id}] for doctor [${conv.doctorId}]: "${rawName}" -> "${formattedPhone}"`);
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { patientName: formattedPhone }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Completed. Cleaned up ${updatedCount} conversation(s).`);
}

sanitizeUnregisteredConversations()
  .catch((e) => {
    console.error("❌ Error sanitizing conversations:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
