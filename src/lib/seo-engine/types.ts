import { TaskPriority } from "@prisma/client";

export interface RuleMetadata {
  id: string;
  version: string;
  name: string;
  category: string;
  description: string;
  apiSource: string;
  fieldMapping: string;
}

export interface RuleObservation {
  ruleMetadata: RuleMetadata;
  detectedValue: string | null;
  observationText: string;
  evidence: string;
  reason: string;
  title: string;
  priority: TaskPriority;
  estimatedEffort: string;
  expectedImpact: string;
  confidenceScore: number; // 0-100
}
