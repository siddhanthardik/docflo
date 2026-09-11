export type ScenarioCategory =
  | "scheduling"
  | "safety"
  | "communication"
  | "hallucination"
  | "doctor_delegation"
  | "context_memory"
  | "empathy"
  | "privacy_security"
  | "adversarial"
  | "whatsapp_robustness";

export type ScenarioDifficulty = "easy" | "medium" | "hard" | "adversarial";

export type ClinicalUrgencyExpected = "ROUTINE" | "PROMPT" | "URGENT" | "EMERGENCY";

export interface AIRBenchScenario {
  id: string; // e.g. "SCH-001", "SAF-001"
  title: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  safetyCritical: boolean;

  clinicContext: {
    doctorName: string;
    specialty: string;
    clinicName: string;
    timings: string;
    morningOpd?: string;
    eveningOpd?: string;
    fees?: string;
    servicesOffered?: string[];
    availableSlots: string[]; // e.g. ["2026-09-12T17:00:00+05:30", "2026-09-12T18:00:00+05:30"]
    holidays?: string[];
  };

  patientPersona?: {
    name?: string;
    phone?: string;
    isExistingPatient?: boolean;
    gender?: string;
    dateOfBirth?: string;
  };

  conversationTurns: Array<{
    turn: number;
    sender: "patient" | "doctor" | "attacker";
    text: string;
    mediaAttachment?: {
      type: "IMAGE" | "PDF" | "AUDIO";
      mimeType: string;
      fileName?: string;
    };
  }>;

  expectedBehavior: {
    expectedUrgency: ClinicalUrgencyExpected;
    mustStopOpdBooking?: boolean;
    requiresDisambiguationOrVerification?: boolean;
    requiredKeywords?: string[];
    forbiddenKeywords?: string[];
    expectedTagPattern?: string; // Regex string for expected [BOOK_APPOINTMENT: ...] or [CANCEL_...]
    forbiddenTagPattern?: string;
  };

  expectedDatabaseState?: {
    appointmentCreated: boolean;
    expectedDate?: string; // YYYY-MM-DD
    expectedTime?: string; // HH:mm or e.g. 6:00 PM
    expectedDoctor?: string;
    expectedPatientName?: string;
    noDuplicateAppointment: boolean;
  };

  catastrophicFailureCriteria: string; // Condition that triggers an immediate 0 / certification FAIL
}

export interface ScenarioResult {
  scenarioId: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  status: "PASS" | "PARTIAL" | "FAIL";
  score: number; // 0 to 1
  isCatastrophic: boolean;
  catastrophicReason?: string;
  deterministicResult: {
    passed: boolean;
    details: string[];
  };
  llmJudgeResult?: {
    empathyScore: number; // 1 to 5
    safetyScore: number; // 1 to 5
    boundaryScore: number; // 1 to 5
    reasoning: string;
  };
  aiReplies: string[];
  durationMs: number;
}
