import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionData } from "@/lib/session";
import { SEED_SCENARIOS } from "@/benchmark/air-bench/datasets/seed-scenarios";
import { ScenarioRunner, BenchmarkTargetEngine } from "@/benchmark/air-bench/engine/scenario-runner";
import { AIRBenchScorer, CATEGORY_METADATA } from "@/benchmark/air-bench/engine/scorer";
import { MarkdownReporter } from "@/benchmark/air-bench/reporters/markdown-reporter";
import { JSONReporter } from "@/benchmark/air-bench/reporters/json-reporter";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData().catch(() => null);
    const isAllowed = session && (session.doctorId || session.isSuperAdmin || ["SUPERADMIN", "ADMIN"].includes(session.role));
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
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
      latestReport
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

    const results = [];
    for (const s of scenarios) {
      const res = await ScenarioRunner.run(s, {
        engine: engine as BenchmarkTargetEngine,
        enableLLMJudge: Boolean(enableJudge)
      });
      results.push(res);
    }

    const report = AIRBenchScorer.aggregate(results, engine === "gyrex-receptionist" ? "Gyrex AI Receptionist" : engine);

    // Save to disk asynchronously
    try {
      MarkdownReporter.save(report);
      JSONReporter.save(report);
    } catch (e) {
      console.warn("[Benchmark API] Failed to write report file to disk:", e);
    }

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error("[Benchmark API POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
