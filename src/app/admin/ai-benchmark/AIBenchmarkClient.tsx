"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Calendar,
  Lock,
  Cpu,
  HeartPulse
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CategoryScore {
  category: string;
  displayName: string;
  weight: number;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  catastrophicFailures: number;
  averageScore: number;
  weightedScore: number;
}

interface ScenarioResult {
  scenarioId: string;
  category: string;
  difficulty: string;
  status: "PASS" | "PARTIAL" | "FAIL";
  score: number;
  isCatastrophic: boolean;
  catastrophicReason?: string;
  deterministicResult: {
    passed: boolean;
    details: string[];
  };
  llmJudgeResult?: {
    empathyScore: number;
    safetyScore: number;
    boundaryScore: number;
    reasoning: string;
  };
  aiReplies: string[];
  durationMs: number;
}

interface BenchmarkReport {
  timestamp: string;
  engineName: string;
  totalScenarios: number;
  passedScenarios: number;
  partialScenarios: number;
  failedScenarios: number;
  totalCatastrophicFailures: number;
  overallScore: number;
  safetyScore: number;
  hallucinationScore: number;
  safetyGatePassed: boolean;
  isCertified: boolean;
  certificationTier: string;
  tierDescription: string;
  categoryScores: Record<string, CategoryScore>;
  catastrophicViolations: Array<{
    scenarioId: string;
    category: string;
    reason: string;
  }>;
  durationMs: number;
  scenarioResults: ScenarioResult[];
}

interface AIBenchmarkClientProps {
  initialData: {
    title: string;
    seedScenarioCount: number;
    availableCategories: string[];
    recentReports: Array<{ fileName: string; size: number; createdAt: string }>;
    latestReport: BenchmarkReport | null;
  };
}

export function AIBenchmarkClient({ initialData }: AIBenchmarkClientProps) {
  const [report, setReport] = useState<BenchmarkReport | null>(initialData.latestReport);
  const [recentReports] = useState(initialData.recentReports);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEngine, setSelectedEngine] = useState<string>("gyrex-receptionist");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          engine: selectedEngine
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        alert(data.error || "Benchmark run failed.");
      }
    } catch (e: any) {
      alert("Execution error: " + (e?.message || e));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectReport = async (fileName: string) => {
    try {
      const res = await fetch(`/api/benchmark?reportFile=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.latestReport) {
        setReport(data.latestReport);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredScenarios = (report?.scenarioResults || []).filter(s => {
    const matchesSearch = s.scenarioId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.aiReplies.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" ? true :
      statusFilter === "catastrophic" ? s.isCatastrophic :
      s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> AIR-Bench v1.0 Certified
            </span>
            <span className="text-xs text-gray-500">Dual-Evaluator Clinical Safety Standard</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            AI Receptionist Healthcare Benchmark
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Objective evaluation of Gyrex WhatsApp AI Receptionist across 8 clinical dimensions with zero-tolerance safety gates.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target Model Selector */}
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value)}
            className="text-xs font-semibold bg-indigo-50/80 border border-indigo-200 text-indigo-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="gyrex-receptionist">✨ Gyrex AI Receptionist (Full Architecture)</option>
            <option value="raw-gemini">🤖 Baseline: Google Gemini 3.6 Flash</option>
            <option value="raw-openai">🤖 Baseline: OpenAI GPT-4o-mini</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium bg-gray-50 border border-gray-300 text-gray-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Dimensions (Full Suite)</option>
            <option value="safety">🛡️ Safety & Escalation (Red Flags)</option>
            <option value="scheduling">🗓️ Appointment & Scheduling</option>
            <option value="hallucination">🚫 Hallucination Resistance</option>
            <option value="doctor_delegation">👨‍⚕️ Doctor / Task Handling</option>
            <option value="context_memory">🧩 Context & Memory</option>
            <option value="privacy_security">🔐 Privacy & Security</option>
            <option value="adversarial">🧠 Jailbreak & Guardrails</option>
          </select>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Sandbox...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Run Live Benchmark
              </>
            )}
          </button>
        </div>
      </div>

      {report ? (
        <>
          {/* Executive Verdict Banner */}
          <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
            report.safetyGatePassed
              ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  report.safetyGatePassed ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-red-500 text-white"
                }`}>
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {report.certificationTier === "CLINICAL_EXCELLENCE"
                        ? "AIR-Bench Clinical Excellence"
                        : report.certificationTier === "CERTIFIED"
                        ? "AIR-Bench Certified"
                        : report.certificationTier}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      report.safetyGatePassed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {report.safetyGatePassed ? "PASSED HARD SAFETY GATE" : "SAFETY GATE BREACH"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 max-w-2xl leading-relaxed">
                    {report.tierDescription}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Evaluated {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })} for target <span className="font-semibold text-gray-700">{report.engineName}</span>
                  </p>
                </div>
              </div>

              {/* Past Reports Selector */}
              {recentReports.length > 1 && (
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200 text-xs text-gray-600">
                  <span>History:</span>
                  <select
                    onChange={(e) => handleSelectReport(e.target.value)}
                    className="bg-transparent font-medium text-gray-800 focus:outline-none"
                  >
                    {recentReports.map(r => (
                      <option key={r.fileName} value={r.fileName}>
                        {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
                <span>Overall Weighted Score</span>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">{report.overallScore}%</span>
                <span className="text-xs font-semibold text-emerald-600">≥90% req.</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${report.overallScore}%` }} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
                <span>Patient Safety & Escalation</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">{report.safetyScore}%</span>
                <span className="text-xs font-semibold text-emerald-600">≥95% req.</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${report.safetyScore}%` }} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
                <span>Catastrophic Safety Errors</span>
                <AlertTriangle className={`w-4 h-4 ${report.totalCatastrophicFailures === 0 ? "text-emerald-500" : "text-red-500"}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${report.totalCatastrophicFailures === 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {report.totalCatastrophicFailures}
                </span>
                <span className="text-xs font-semibold text-gray-500">Max 0 allowed</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {report.totalCatastrophicFailures === 0 ? "✅ 100% Emergency Halts Verified" : "❌ Urgent Attention Required"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
                <span>Scenario Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {report.passedScenarios}/{report.totalScenarios}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {((report.passedScenarios / report.totalScenarios) * 100).toFixed(0)}% passed
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Completed in {(report.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {/* 8-Dimension Breakdown Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-indigo-600" /> 8-Dimension Clinical Axes Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(report.categoryScores).map((cat) => (
                <div key={cat.category} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{cat.displayName}</span>
                    <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                      {(cat.weight * 100).toFixed(0)}% wt
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Score: <strong className="text-gray-900 font-bold">{cat.averageScore.toFixed(1)}%</strong></span>
                    <span>Passed: {cat.passedScenarios}/{cat.totalScenarios}</span>
                    <span>Errors: {cat.catastrophicFailures > 0 ? <strong className="text-red-600">{cat.catastrophicFailures}</strong> : "0"}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        cat.averageScore >= 95 ? "bg-emerald-500" : cat.averageScore >= 80 ? "bg-indigo-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${cat.averageScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Scenario Audit Log */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Scenario Audit Trail</h3>
                <p className="text-xs text-gray-500 mt-0.5">Inspect simulated conversation turns, AI responses, and code assertions.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scenarios..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="PASS">Pass Only</option>
                  <option value="FAIL">Fail Only</option>
                  <option value="catastrophic">Catastrophic</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50/80 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Scenario ID</th>
                    <th className="py-3 px-4">Dimension</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Verdict</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredScenarios.map((s) => (
                    <>
                      <tr
                        key={s.scenarioId}
                        onClick={() => setExpandedScenario(expandedScenario === s.scenarioId ? null : s.scenarioId)}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-gray-900">{s.scenarioId}</td>
                        <td className="py-3 px-4 capitalize">{s.category.replace("_", " ")}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 capitalize">
                            {s.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{(s.score * 100).toFixed(0)}%</td>
                        <td className="py-3 px-4">
                          {s.status === "PASS" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                            </span>
                          ) : s.isCatastrophic ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Catastrophic
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Fail
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-indigo-600">
                          {expandedScenario === s.scenarioId ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {expandedScenario === s.scenarioId && (
                        <tr className="bg-slate-50/70 border-b border-gray-100">
                          <td colSpan={6} className="p-4 space-y-3">
                            <div className="text-xs">
                              <span className="font-bold text-gray-700">Code Assertions:</span>
                              <div className="mt-1 space-y-1 font-mono text-[11px]">
                                {s.deterministicResult.details.map((d, i) => (
                                  <div key={i} className={d.startsWith("❌") ? "text-red-600 font-semibold" : "text-emerald-700"}>
                                    {d}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="text-xs">
                              <span className="font-bold text-gray-700">AI Receptionist Reply:</span>
                              <div className="mt-1 bg-white p-3 rounded-xl border border-gray-200 text-gray-800 whitespace-pre-wrap font-sans text-xs">
                                {s.aiReplies.join("\n\n---\n\n")}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No Benchmark Report Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Click &quot;Run Live Benchmark&quot; above to execute the 20 gold-standard seed scenarios through the isolated clinical sandbox.
          </p>
        </div>
      )}
    </div>
  );
}
