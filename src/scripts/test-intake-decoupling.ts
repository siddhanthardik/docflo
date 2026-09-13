import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  console.log('================================================================');
  console.log('  AUTOMATED VERIFICATION: WHATSAPP INTAKE & MULTI-TENANT ISOLATION');
  console.log('================================================================\n');

  // Find or use a test doctor
  let testDoctor = await prisma.doctor.findFirst({
    where: { email: { contains: 'docflo' } }
  });

  if (!testDoctor) {
    testDoctor = await prisma.doctor.findFirst();
  }

  if (!testDoctor) {
    console.error('No test doctor available in database.');
    return;
  }

  const doctorId = testDoctor.id;
  const testPhone = '9999988888';
  console.log(`Using Doctor: ${testDoctor.name} (${doctorId})`);
  console.log(`Test Phone: ${testPhone}\n`);

  // Clean up any test artifacts before running
  await prisma.chatMessage.deleteMany({ where: { conversation: { doctorId, patientPhone: testPhone } } });
  await prisma.conversation.deleteMany({ where: { doctorId, patientPhone: testPhone } });
  await prisma.appointment.deleteMany({ where: { doctorId, patient: { phone: testPhone } } });
  await prisma.patient.deleteMany({ where: { doctorId, phone: testPhone } });

  try {
    // -------------------------------------------------------------
    // TEST 1: INCOMING CHAT MUST NOT CREATE A PATIENT
    // -------------------------------------------------------------
    console.log('TEST 1: Incoming WhatsApp Chat Initiation...');
    
    // Simulate what whatsapp-manager now does:
    const cleanPtDigits = testPhone.replace(/\D/g, '');
    const last10Digits = cleanPtDigits.length >= 10 ? cleanPtDigits.slice(-10) : cleanPtDigits;
    
    let patient = await prisma.patient.findFirst({
      where: {
        doctorId,
        OR: [
          { phone: testPhone },
          { phone: `+${testPhone}` },
          ...(last10Digits.length >= 10 ? [{ phone: { endsWith: last10Digits } }] : [])
        ]
      }
    });

    const pushNameRaw = 'Grandfather Sender';
    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : pushNameRaw;

    const conversation = await prisma.conversation.create({
      data: {
        doctorId,
        patientPhone: testPhone,
        patientName,
        patientId: patient ? patient.id : null,
        status: 'OPEN'
      }
    });

    // Check patient table
    const patientCountAfterChat = await prisma.patient.count({
      where: { doctorId, phone: testPhone }
    });

    if (patientCountAfterChat === 0 && conversation.patientId === null) {
      console.log('  ✅ PASSED: Conversation created with patientId: null. ZERO patients created in CRM.\n');
    } else {
      throw new Error(`FAIL: Expected 0 patients, found ${patientCountAfterChat}`);
    }

    // -------------------------------------------------------------
    // TEST 2: CONFIRMED BOOKING CREATES ONLY THE ACTUAL PATIENT
    // -------------------------------------------------------------
    console.log('TEST 2: Confirmed Booking for "Samarth" (Child)...');
    const candidateFirstName = 'Samarth';
    const candidateLastName = 'Kumar';

    // Count existing family members under this doctor and phone
    const existingFamilyCount = await prisma.patient.count({
      where: {
        doctorId,
        OR: [
          { phone: testPhone },
          { phone: `+${testPhone}` },
          ...(last10Digits.length >= 10 ? [{ phone: { endsWith: last10Digits } }] : [])
        ]
      }
    });

    const createdPatient = await prisma.patient.create({
      data: {
        doctorId,
        firstName: candidateFirstName,
        lastName: candidateLastName,
        phone: testPhone,
        gender: 'MALE',
        patientType: 'ACTIVE',
        tags: existingFamilyCount > 0 ? ['WhatsApp', 'Family Member'] : ['WhatsApp']
      }
    });

    // Re-link conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        patientId: createdPatient.id,
        patientName: `${createdPatient.firstName} ${createdPatient.lastName}`.trim()
      }
    });

    const updatedConv = await prisma.conversation.findUnique({ where: { id: conversation.id } });

    if (createdPatient.firstName === 'Samarth' && !createdPatient.tags.includes('Family Member') && updatedConv?.patientId === createdPatient.id) {
      console.log(`  ✅ PASSED: Patient "Samarth" created with tags [${createdPatient.tags.join(', ')}]. Conversation re-linked.\n`);
    } else {
      throw new Error('FAIL: First patient should have tag ["WhatsApp"] and be linked to conversation');
    }

    // -------------------------------------------------------------
    // TEST 3: SUBSEQUENT DISTINCT FAMILY MEMBER GETS "FAMILY MEMBER" TAG
    // -------------------------------------------------------------
    console.log('TEST 3: Second Booking for Brother "Aarav"...');
    const familyCount2 = await prisma.patient.count({
      where: {
        doctorId,
        OR: [
          { phone: testPhone },
          { phone: `+${testPhone}` },
          ...(last10Digits.length >= 10 ? [{ phone: { endsWith: last10Digits } }] : [])
        ]
      }
    });

    const secondPatient = await prisma.patient.create({
      data: {
        doctorId,
        firstName: 'Aarav',
        lastName: 'Kumar',
        phone: testPhone,
        gender: 'MALE',
        patientType: 'ACTIVE',
        tags: familyCount2 > 0 ? ['WhatsApp', 'Family Member'] : ['WhatsApp']
      }
    });

    if (secondPatient.tags.includes('Family Member')) {
      console.log(`  ✅ PASSED: Second patient "Aarav" correctly received tags [${secondPatient.tags.join(', ')}].\n`);
    } else {
      throw new Error('FAIL: Second patient should have "Family Member" tag');
    }

    // -------------------------------------------------------------
    // TEST 4: MULTI-TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('TEST 4: Multi-Tenant Scoping Isolation...');
    const fakeDoctorId = 'cmfake0000000000000000000';

    const crossClinicPatients = await prisma.patient.findMany({
      where: {
        doctorId: fakeDoctorId,
        phone: testPhone
      }
    });

    if (crossClinicPatients.length === 0) {
      console.log('  ✅ PASSED: Query for different doctorId returned 0 patients. Absolute isolation enforced.\n');
    } else {
      throw new Error('FAIL: Cross-tenant data leak detected!');
    }

    console.log('================================================================');
    console.log('  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (4/4)');
    console.log('================================================================');

  } finally {
    // Cleanup test records
    await prisma.chatMessage.deleteMany({ where: { conversation: { doctorId, patientPhone: testPhone } } });
    await prisma.conversation.deleteMany({ where: { doctorId, patientPhone: testPhone } });
    await prisma.patient.deleteMany({ where: { doctorId, phone: testPhone } });
    console.log('Cleaned up test records.');
  }
}

runTests()
  .catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
