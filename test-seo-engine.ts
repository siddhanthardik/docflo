import { GoogleSyncEngine } from './src/services/sync-engine/GoogleSyncEngine';

async function main() {
  const doctorId = 'test_doctor';
  console.log('Starting Google Sync Engine for doctor:', doctorId);
  try {
    const result = await GoogleSyncEngine.syncAll(doctorId);
    console.log('Sync result:', result);
  } catch (error) {
    console.error('Error running sync engine:', error);
  }
}

main();
