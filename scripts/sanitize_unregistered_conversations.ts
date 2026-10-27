import { prisma } from "../src/lib/prisma";

async function sanitizeAndSyncConversations() {
  console.log("🔍 Checking all conversations for clinical name synchronization...");

  const allConversations = await prisma.conversation.findMany({
    select: {
      id: true,
      doctorId: true,
      patientId: true,
      patientName: true,
      patientPhone: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  console.log(`Found ${allConversations.length} total conversation(s).`);

  let registeredUpdatedCount = 0;
  let unregisteredUpdatedCount = 0;

  for (const conv of allConversations) {
    const rawName = conv.patientName || "";
    const isStaffOrDoctor = rawName.toLowerCase().includes("doctor") || rawName.toLowerCase().includes("staff");
    if (isStaffOrDoctor) continue;

    const cleanDigits = (conv.patientPhone || "").replace(/\D/g, "");
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const formattedPhone = conv.patientPhone.startsWith("+") ? conv.patientPhone : `+${conv.patientPhone}`;

    let linkedPatient = conv.patient;

    // If conversation is not linked to a patientId yet, check if a patient exists by phone
    if (!linkedPatient) {
      linkedPatient = await prisma.patient.findFirst({
        where: {
          doctorId: conv.doctorId,
          OR: [
            { phone: conv.patientPhone },
            { phone: formattedPhone },
            { phone: cleanDigits },
            ...(last10.length >= 10 ? [{ phone: { endsWith: last10 } }] : [])
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      });
    }

    if (linkedPatient) {
      // It is a registered patient! Sync patientName with legal chart name
      const officialName = `${linkedPatient.firstName} ${linkedPatient.lastName || ""}`.trim();
      if (rawName !== officialName || conv.patientId !== linkedPatient.id) {
        console.log(`✨ Syncing Registered Patient [${conv.id}]: "${rawName}" -> "${officialName}" (Patient ID: ${linkedPatient.id})`);
        await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            patientId: linkedPatient.id,
            patientName: officialName,
          }
        });
        registeredUpdatedCount++;
      }
    } else {
      // It is an unregistered contact! Ensure patientName is strictly the formatted phone number
      if (rawName !== formattedPhone) {
        console.log(`🧼 Sanitizing Unregistered Contact [${conv.id}]: "${rawName}" -> "${formattedPhone}"`);
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { patientName: formattedPhone }
        });
        unregisteredUpdatedCount++;
      }
    }
  }

  console.log(`✅ Completed. Updated ${registeredUpdatedCount} registered patient(s) and sanitized ${unregisteredUpdatedCount} unregistered contact(s).`);
}

sanitizeAndSyncConversations()
  .catch((e) => {
    console.error("❌ Error running synchronization:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
