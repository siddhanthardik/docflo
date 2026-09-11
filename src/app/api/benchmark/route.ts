import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionData } from "@/lib/session";
import { SEED_SCENARIOS } from "@/benchmark/air-bench/datasets/seed-scenarios";
import { ScenarioRunner, BenchmarkTargetEngine } from "@/benchmark/air-bench/engine/scenario-runner";
import { AIRBenchScorer, CATEGORY_METADATA } from "@/benchmark/air-bench/engine/scorer";
import { MarkdownReporter } from "@/benchmark/air-bench/reporters/markdown-reporter";
import { JSONReporter } from "@/benchmark/air-bench/reporters/json-reporter";

export interface BenchmarkJob {
  id: string;
  engine: BenchmarkTargetEngine;
  category?: string;
  limit?: number;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  progress: {
    current: number;
    total: number;
    currentScenarioId?: string;
    currentCategory?: string;
  };
  report: any | null;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// Global cache to maintain background jobs across requests within the Node server
const jobsMap: Map<string, BenchmarkJob> =
  (globalThis as any).__airBenchJobs || ((globalThis as any).__airBenchJobs = new Map<string, BenchmarkJob>());

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData().catch(() => null);
    const isAllowed = session && (session.doctorId || session.isSuperAdmin || ["SUPERADMIN", "ADMIN"].includes(session.role));
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedJobId = searchParams.get("jobId");

    // 1. If checking status of a specific background job
    if (requestedJobId) {
      const job = jobsMap.get(requestedJobId);
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        job
      });
    }

    // 2. Check for any currently active running job
    let activeJob: any = null;
    for (const job of jobsMap.values()) {
      if (job.status === "RUNNING") {
        const elapsed = Date.now() - new Date(job.startedAt).getTime();
        if (elapsed > 10 * 60 * 1000) {
          job.status = "FAILED";
          job.error = "Benchmark execution timed out after 10 minutes.";
        } else {
          activeJob = {
            id: job.id,
            engine: job.engine,
            category: job.category,
            status: job.status,
            progress: job.progress,
            startedAt: job.startedAt
          };
          break;
        }
      }
    }

    const requestedFile = searchParams.get("reportFile");
    const reportsDir = path.resolve(process.cwd(), "src/benchmark/air-bench/reports");
    let reports: Array<{ fileName: string; size: number; createdAt: string }> = [];
    let latestReport = null;

    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir).filter(f => f.endsWith(".json"));
      reports = files.map(f => {
        const full = path.join(reportsDir, f);
        const stat = fs.statSync(full);
        return {
          fileName: f,
          size: stat.size,
          createdAt: stat.birthtime.toISOString()
        };
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const targetFileName = requestedFile && reports.some(r => r.fileName === requestedFile)
        ? requestedFile
        : reports[0]?.fileName;

      if (targetFileName) {
        try {
          const content = fs.readFileSync(path.join(reportsDir, targetFileName), "utf8");
          latestReport = JSON.parse(content);
        } catch (e) {
          console.warn("[Benchmark API] Failed to parse report file:", e);
        }
      }
    }

    return NextResponse.json({
      title: "AIR-Bench v1.0: AI Receptionist Benchmark for Healthcare",
      dimensions: CATEGORY_METADATA,
      seedScenarioCount: SEED_SCENARIOS.length,
      availableCategories: Object.keys(CATEGORY_METADATA),
      recentReports: reports.slice(0, 15),
      latestReport,
      activeJob
    });
  } catch (err: any) {
    console.error("[Benchmark API GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData().catch(() => null);
    const isAllowed = session && (session.doctorId || session.isSuperAdmin || ["SUPERADMIN", "ADMIN"].includes(session.role));
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      category,
      limit,
      engine = "gyrex-receptionist",
      enableJudge = false
    } = body;

    let scenarios = [...SEED_SCENARIOS];

    if (category) {
      scenarios = scenarios.filter(s => s.category.toLowerCase() === String(category).toLowerCase());
    }

    if (limit && typeof limit === "number" && limit > 0) {
      scenarios = scenarios.slice(0, limit);
    }

    if (scenarios.length === 0) {
      return NextResponse.json({ error: "No scenarios match the given criteria." }, { status: 400 });
    }

    // Check if an existing job is actively running (<10 minutes old)
    for (const j of jobsMap.values()) {
      if (j.status === "RUNNING") {
        const elapsed = Date.now() - new Date(j.startedAt).getTime();
        if (elapsed < 10 * 60 * 1000) {
          return NextResponse.json({
            success: true,
            jobId: j.id,
            status: "RUNNING",
            progress: j.progress,
            message: "A benchmark run is already in progress."
          });
        } else {
          j.status = "FAILED";
          j.error = "Previous job timed out.";
        }
      }
    }

    const jobId = `bench_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job: BenchmarkJob = {
      id: jobId,
      engine: engine as BenchmarkTargetEngine,
      category,
      limit,
      status: "RUNNING",
      progress: {
        current: 0,
        total: scenarios.length,
        currentScenarioId: scenarios[0]?.id,
        currentCategory: scenarios[0]?.category
      },
      report: null,
      startedAt: new Date().toISOString()
    };
    jobsMap.set(jobId, job);

    // Launch execution in background without blocking HTTP response
    (async () => {
      try {
        const results = [];
        for (let i = 0; i < scenarios.length; i++) {
          const s = scenarios[i];
          job.progress.current = i;
          job.progress.currentScenarioId = s.id;
          job.progress.currentCategory = s.category;

          const res = await ScenarioRunner.run(s, {
            engine: engine as BenchmarkTargetEngine,
            enableLLMJudge: Boolean(enableJudge)
          });
          results.push(res);
        }

        const report = AIRBenchScorer.aggregate(
          results,
          engine === "gyrex-receptionist" ? "Gyrex AI Receptionist" : engine
        );

        // Save report files to disk
        try {
          MarkdownReporter.save(report);
          JSONReporter.save(report);
        } catch (e) {
          console.warn("[Benchmark API] Failed to write report file to disk:", e);
        }

        job.status = "COMPLETED";
        job.progress.current = scenarios.length;
        job.report = report;
        job.completedAt = new Date().toISOString();
      } catch (err: any) {
        console.error("[Benchmark API Background Error]:", err);
        job.status = "FAILED";
        job.error = err?.message || "Execution failed in background runner";
        job.completedAt = new Date().toISOString();
      }
    })().catch((err) => {
      console.error("[Benchmark API Unhandled Error]:", err);
    });

    // Return immediate response with jobId (prevents Nginx 504 Gateway Timeout)
    return NextResponse.json({
      success: true,
      jobId,
      status: "RUNNING",
      progress: job.progress
    });
  } catch (err: any) {
    console.error("[Benchmark API POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
