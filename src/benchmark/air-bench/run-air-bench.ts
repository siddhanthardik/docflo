import dotenv from "dotenv";
import path from "path";

// Load environment variables before any service imports
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { SEED_SCENARIOS } from "./datasets/seed-scenarios";
import { ScenarioRunner, BenchmarkTargetEngine } from "./engine/scenario-runner";
import { AIRBenchScorer } from "./engine/scorer";
import { CLIReporter } from "./reporters/cli-reporter";
import { JSONReporter } from "./reporters/json-reporter";
import { MarkdownReporter } from "./reporters/markdown-reporter";
import { AIRBenchScenario, ScenarioResult } from "./datasets/schema";

async function main() {
  const args = process.argv.slice(2);
  let categoryFilter: string | undefined;
  let limitFilter: number | undefined;
  let engine: BenchmarkTargetEngine = "gyrex-receptionist";
  let enableJudge = false;
  let saveReport = true;

  for (const arg of args) {
    if (arg.startsWith("--category=")) {
      categoryFilter = arg.split("=")[1]?.toLowerCase();
    } else if (arg.startsWith("--limit=")) {
      limitFilter = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--engine=")) {
      engine = arg.split("=")[1] as BenchmarkTargetEngine;
    } else if (arg === "--judge" || arg === "--judge=true") {
      enableJudge = true;
    } else if (arg === "--no-save") {
      saveReport = false;
    }
  }

  console.log(`\n🚀 Initializing AIR-Bench v1.0 Evaluation Harness...`);
  console.log(`🤖 Target Engine: ${engine}`);
  console.log(`⚖️  LLM Judge: ${enableJudge ? "ENABLED (Gemini 2.5 Flash)" : "DISABLED (Fast Deterministic Mode)"}`);

  let scenarios: AIRBenchScenario[] = [...SEED_SCENARIOS];

  if (categoryFilter) {
    scenarios = scenarios.filter(s => s.category.toLowerCase() === categoryFilter);
    console.log(`🔍 Filtered by Category: "${categoryFilter}" (${scenarios.length} scenarios)`);
  }

  if (limitFilter && limitFilter > 0) {
    scenarios = scenarios.slice(0, limitFilter);
    console.log(`🎯 Limit applied: Running first ${limitFilter} scenarios`);
  }

  if (scenarios.length === 0) {
    console.error("❌ No matching scenarios found for the specified filters.");
    process.exit(1);
  }

  console.log(`\n⏳ Executing ${scenarios.length} benchmark scenarios...\n`);

  const results: ScenarioResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    process.stdout.write(`[${i + 1}/${scenarios.length}] Running [${s.id}] ${s.title.slice(0, 45)}... `);

    try {
      const res = await ScenarioRunner.run(s, {
        engine,
        enableLLMJudge: enableJudge
      });
      results.push(res);

      if (res.isCatastrophic) {
        process.stdout.write(`🚨 CATASTROPHIC FAIL\n`);
      } else if (res.status === "PASS") {
        process.stdout.write(`✅ PASS (${(res.score * 100).toFixed(0)}%)\n`);
      } else if (res.status === "PARTIAL") {
        process.stdout.write(`🟡 PARTIAL (${(res.score * 100).toFixed(0)}%)\n`);
      } else {
        process.stdout.write(`❌ FAIL (${(res.score * 100).toFixed(0)}%)\n`);
      }
    } catch (err: any) {
      console.error(`\n❌ Error running scenario ${s.id}:`, err?.message || err);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n🏁 Completed evaluation in ${(elapsed / 1000).toFixed(1)}s.\n`);

  // Aggregate Scores & Produce Reports
  const report = AIRBenchScorer.aggregate(results, engine === "gyrex-receptionist" ? "Gyrex AI Receptionist" : engine);

  // 1. Terminal Printout
  CLIReporter.print(report);

  // 2. Save Reports
  if (saveReport) {
    const mdPath = MarkdownReporter.save(report);
    const jsonPath = JSONReporter.save(report);
    console.log(`📄 Markdown Report: ${mdPath}`);
    console.log(`💾 JSON Report:     ${jsonPath}\n`);
  }

  if (!report.safetyGatePassed) {
    console.warn(`⚠️ Warning: Benchmark completed with Safety Gate violations. Non-certified status.`);
  }
}

main().catch(err => {
  console.error("Fatal Benchmark Harness Error:", err);
  process.exit(1);
});
