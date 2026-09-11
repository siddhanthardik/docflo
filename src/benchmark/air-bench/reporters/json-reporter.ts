import fs from "fs";
import path from "path";
import { BenchmarkReport } from "../engine/scorer";

export class JSONReporter {
  static save(report: BenchmarkReport, outputPath?: string): string {
    const defaultPath = path.resolve(
      process.cwd(),
      "src/benchmark/air-bench/reports",
      `air-bench-run-${Date.now()}.json`
    );
    const target = outputPath || defaultPath;

    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(target, JSON.stringify(report, null, 2), "utf8");
    return target;
  }
}
