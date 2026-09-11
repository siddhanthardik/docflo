import { BenchmarkReport, CategoryScore } from "../engine/scorer";

export class CLIReporter {
  static print(report: BenchmarkReport) {
    const divider = "═".repeat(78);
    const thinDivider = "─".repeat(78);

    console.log(`\n${divider}`);
    console.log(`🏥  AIR-BENCH v1.0: AI RECEPTIONIST BENCHMARK FOR HEALTHCARE`);
    console.log(`🎯  Evaluation Target: ${report.engineName}`);
    console.log(`⏰  Timestamp: ${report.timestamp}`);
    console.log(`${divider}\n`);

    // 1. Overall Score & Certification Banner
    const badgeColor = report.safetyGatePassed ? "🟢" : "🔴";
    console.log(`🏆  OVERALL STATUS: ${badgeColor} ${report.certificationTier}`);
    console.log(`📜  Verdict: ${report.tierDescription}`);
    console.log(`📊  Overall Score: ${report.overallScore}% | Safety Score: ${report.safetyScore}%`);
    console.log(`🚨  Catastrophic Failures: ${report.totalCatastrophicFailures} (Safety Gate: ${report.safetyGatePassed ? "PASSED ✅" : "FAILED ❌"})`);
    console.log(`⏱️  Total Duration: ${(report.durationMs / 1000).toFixed(1)}s for ${report.totalScenarios} scenarios`);
    console.log(`\n${thinDivider}`);

    // 2. Category Breakdown Table
    console.log(`DIMENSION BREAKDOWN (8 CORE HEALTHCARE AXES):`);
    console.log(thinDivider);
    console.log(
      ` ${"Dimension".padEnd(38)} | ${"Weight".padEnd(6)} | ${"Score".padEnd(7)} | ${"Pass/Total".padEnd(10)} | Catastrophic`
    );
    console.log(thinDivider);

    for (const cat of Object.values(report.categoryScores)) {
      const weightStr = `${(cat.weight * 100).toFixed(0)}%`.padEnd(6);
      const scoreStr = `${cat.averageScore.toFixed(1)}%`.padEnd(7);
      const passStr = `${cat.passedScenarios}/${cat.totalScenarios}`.padEnd(10);
      const catColor = cat.catastrophicFailures > 0 ? `❌ ${cat.catastrophicFailures}` : `✅ 0`;

      console.log(
        ` ${cat.displayName.padEnd(38)} | ${weightStr} | ${scoreStr} | ${passStr} | ${catColor}`
      );
    }
    console.log(thinDivider);

    // 3. Catastrophic Violations List (if any)
    if (report.catastrophicViolations.length > 0) {
      console.log(`\n🚨 CATASTROPHIC SAFETY FAILURES (HARD GATE BREACHES):`);
      report.catastrophicViolations.forEach((v, idx) => {
        console.log(`  ${idx + 1}. [${v.scenarioId}] (${v.category}): ${v.reason}`);
      });
      console.log(`\n⚠️  NOTE: By AIR-Bench Healthcare Safety Mandates, an AI with even 1 catastrophic failure CANNOT be certified for clinical WhatsApp reception.`);
    }

    // 4. Scenario-by-Scenario Quick Summary
    console.log(`\n📋 SCENARIO AUDIT LOG:`);
    for (const res of report.scenarioResults) {
      const icon = res.status === "PASS" ? "✅" : res.status === "PARTIAL" ? "🟡" : "❌";
      const catTag = res.isCatastrophic ? " [CATASTROPHIC]" : "";
      console.log(`  ${icon} [${res.scenarioId}] ${res.category.padEnd(16)} - Score: ${(res.score * 100).toFixed(0)}%${catTag}`);
      if (res.status === "FAIL") {
        res.deterministicResult.details.forEach(d => {
          if (d.startsWith("❌")) console.log(`     ${d}`);
        });
      }
    }

    console.log(`\n${divider}\n`);
  }
}
