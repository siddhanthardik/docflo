import { prisma } from "@/lib/prisma";
import { evaluateRules } from "./ruleset";
import { createSnapshotFromAccount } from "./fetcher";
import { ScanStatus, TaskStatus } from "@prisma/client";
import crypto from "crypto";

export async function runSeoEngine(gbpAccountId: string, idempotencyKey?: string) {
  const engineVersion = "2.0.0";
  
  // 1. Idempotency Check
  const key = idempotencyKey || crypto.randomUUID();
  const existingRun = await prisma.engineRun.findUnique({
    where: { gbpAccountId_idempotencyKey: { gbpAccountId, idempotencyKey: key } }
  });
  if (existingRun && existingRun.status === ScanStatus.SUCCESS) {
    return []; // Already ran successfully
  }

  // 2. Initialize Engine Run
  const engineRun = await prisma.engineRun.create({
    data: {
      gbpAccountId,
      status: ScanStatus.PARTIAL,
      idempotencyKey: key,
    }
  });

  await prisma.seoEngineLog.create({
    data: {
      engineRunId: engineRun.id,
      eventType: "SCAN_STARTED",
      message: "Engine execution initialized.",
      metadata: { engineVersion, idempotencyKey: key }
    }
  });

  try {
    // 3. Fetch Data (Append-only Snapshot)
    const snapshot = await createSnapshotFromAccount(gbpAccountId, engineRun.id, engineVersion);
    
    // Previous Snapshot for Diffing
    const previousSnapshot = await prisma.gbpSnapshot.findFirst({
      where: { 
        gbpAccountId, 
        id: { not: snapshot.id },
        scanStatus: ScanStatus.SUCCESS 
      },
      orderBy: { scannedAt: "desc" },
    });

    // 4. Run Deterministic Ruleset
    const startRules = Date.now();
    const ruleObservations = evaluateRules(snapshot, previousSnapshot);
    const rulesDurationMs = Date.now() - startRules;

    await prisma.seoEngineLog.create({
      data: {
        engineRunId: engineRun.id,
        eventType: "RULE_EXECUTED",
        message: `Evaluated ${ruleObservations.length} rules against snapshot.`,
        metadata: { rulesDurationMs, observationCount: ruleObservations.length }
      }
    });

    // 5. Aggregate and Generate Tasks
    const tasksGenerated = [];
    
    // We transactionally save observations and upsert pending tasks
    await prisma.$transaction(async (tx) => {
      for (const obs of ruleObservations) {
        // Save the raw observation
        const observationRecord = await tx.seoObservation.create({
          data: {
            gbpSnapshotId: snapshot.id,
            ruleId: obs.ruleMetadata.id,
            ruleVersion: obs.ruleMetadata.version,
            category: obs.ruleMetadata.category,
            detectedValue: obs.detectedValue
          }
        });

        // See if a PENDING task for this rule already exists
        const existingTask = await tx.seoTask.findFirst({
          where: { 
            gbpAccountId, 
            ruleId: obs.ruleMetadata.id,
            status: TaskStatus.PENDING 
          }
        });

        if (existingTask) {
          // Aggregate/update evidence instead of duplicating
          await tx.seoTask.update({
            where: { id: existingTask.id },
            data: {
              observationId: observationRecord.id,
              observationText: obs.observationText,
              evidence: obs.evidence,
              engineVersion,
              ruleVersion: obs.ruleMetadata.version
            }
          });
        } else {
          // Create new task
          const newTask = await tx.seoTask.create({
            data: {
              gbpAccountId,
              observationId: observationRecord.id,
              engineVersion,
              ruleId: obs.ruleMetadata.id,
              ruleVersion: obs.ruleMetadata.version,
              apiSource: obs.ruleMetadata.apiSource,
              fieldMapping: obs.ruleMetadata.fieldMapping,
              observationText: obs.observationText,
              evidence: obs.evidence,
              reason: obs.reason,
              title: obs.title,
              priority: obs.priority,
              estimatedEffort: obs.estimatedEffort,
              expectedImpact: obs.expectedImpact,
              confidenceScore: obs.confidenceScore,
              status: TaskStatus.PENDING
            }
          });
          tasksGenerated.push(newTask);
        }
      }
    });

    await prisma.seoEngineLog.create({
      data: {
        engineRunId: engineRun.id,
        eventType: "TASK_GENERATED",
        message: `Generated ${tasksGenerated.length} new tasks. Aggregated existing.`,
        metadata: { newTasksCount: tasksGenerated.length }
      }
    });

    // 6. Complete Run
    await prisma.engineRun.update({
      where: { id: engineRun.id },
      data: {
        status: snapshot.scanStatus,
        completedAt: new Date(),
        durationMs: Date.now() - engineRun.startedAt.getTime()
      }
    });

    return await prisma.seoTask.findMany({
      where: { gbpAccountId, status: TaskStatus.PENDING },
      orderBy: { createdAt: "desc" }
    });
    
  } catch (error: any) {
    await prisma.seoEngineLog.create({
      data: {
        engineRunId: engineRun.id,
        eventType: "API_FAILURE",
        message: "Engine execution failed fatally.",
        metadata: { error: error.message, stack: error.stack }
      }
    });
    
    await prisma.engineRun.update({
      where: { id: engineRun.id },
      data: {
        status: ScanStatus.FAILED,
        completedAt: new Date(),
        durationMs: Date.now() - engineRun.startedAt.getTime()
      }
    });
    
    return [];
  }
}
