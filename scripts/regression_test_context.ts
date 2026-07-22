import { GoogleBusinessProfileService } from "../src/services/googleBusinessProfile.service";
import { prisma } from "../src/lib/prisma";

async function runRegressionTests() {
  console.log("Running Location Context Normalization Regression Tests...");

  const TEST_DOCTOR_ID = "regression_test_doc_123";

  // Cleanup past runs
  await prisma.gbpAccount.deleteMany({ where: { doctorId: TEST_DOCTOR_ID } });
  await prisma.doctor.deleteMany({ where: { id: TEST_DOCTOR_ID } });

  // Create test doctor
  await prisma.doctor.create({
    data: {
      id: TEST_DOCTOR_ID,
      email: "test_doc_123@example.com",
      password: "password123",
      name: "Test Doctor"
    }
  });

  // 1. Disconnected account
  const connectedBefore = await GoogleBusinessProfileService.getConnectedProfile(TEST_DOCTOR_ID);
  console.log("Test 1 - Disconnected account:", connectedBefore === false ? "PASSED" : "FAILED");

  // 2. Connected account with one location
  await prisma.gbpAccount.create({
    data: {
      doctorId: TEST_DOCTOR_ID,
      locationId: "loc_1",
      locationName: "Test Clinic 1",
      insightsData: {},
      accessToken: "dummy_token",
      refreshToken: "dummy_token",
      tokenExpiry: new Date()
    }
  });

  const connectedAfter1 = await GoogleBusinessProfileService.getConnectedProfile(TEST_DOCTOR_ID);
  const accounts1 = await GoogleBusinessProfileService.getAccounts(TEST_DOCTOR_ID);
  console.log("Test 2 - Connected with one location:", (connectedAfter1 && accounts1.length === 1) ? "PASSED" : "FAILED");

  // 3. Connected account with multiple locations
  await prisma.gbpAccount.create({
    data: {
      doctorId: TEST_DOCTOR_ID,
      locationId: "loc_2",
      locationName: "Test Clinic 2",
      insightsData: {},
      accessToken: "dummy_token",
      refreshToken: "dummy_token",
      tokenExpiry: new Date()
    }
  });

  const accounts2 = await GoogleBusinessProfileService.getAccounts(TEST_DOCTOR_ID);
  console.log("Test 3 - Connected with multiple locations:", accounts2.length === 2 ? "PASSED" : "FAILED");

  // 4. Test Active Location Resolution
  const activeLocation = await GoogleBusinessProfileService.getActiveLocation(TEST_DOCTOR_ID, accounts2[0].id);
  console.log("Test 4 - Active Location Resolve:", activeLocation?.id === accounts2[0].id ? "PASSED" : "FAILED");

  // Cleanup
  await prisma.gbpAccount.deleteMany({ where: { doctorId: TEST_DOCTOR_ID } });
  await prisma.doctor.deleteMany({ where: { id: TEST_DOCTOR_ID } });
  
  console.log("All tests finished.");
}

runRegressionTests().catch(console.error);
