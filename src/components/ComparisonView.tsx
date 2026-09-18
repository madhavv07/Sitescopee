import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ArrowLeft, ExternalLink, BarChart3, Smartphone, Monitor, Trash2 } from "lucide-react";
import { AnalysisResult, Strategy } from "../types";

interface ComparisonViewProps {
  analyses: AnalysisResult[];
  onBackToCurrent: () => void;
  onSelectAnalysis: (analysis: AnalysisResult) => void;
  onDeleteAnalysis?: (id: string) => void;
}

export function ComparisonView({
  analyses,
  onBackToCurrent,
  onSelectAnalysis,
  onDeleteAnalysis,
}: ComparisonViewProps) {
  const [strategy, setStrategy] = useState<Strategy>("mobile");

  if (analyses.length < 2) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg text-center space-y-4">
        <h3 className="font-gaegu text-3xl font-bold text-[var(--ink)]">
          Not Enough Sites to Compare
        </h3>
        <p className="font-mono text-xs text-[var(--ink-muted)] max-w-md mx-auto">
          Analyze at least 2 different website URLs to unlock side-by-side comparative benchmarking and visual charts.
        </p>
        <button
          type="button"
          onClick={onBackToCurrent}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm font-mono text-xs font-bold hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analysis
        </button>
      </div>
    );
  }

  // Prepare chart data for Recharts
  const chartData = [
    {
      category: "Performance",
      ...analyses.reduce((acc, item) => {
        const stratData = strategy === "desktop" ? item.desktop : item.mobile;
        acc[item.domain] = stratData.performance;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      category: "SEO",
      ...analyses.reduce((acc, item) => {
        const stratData = strategy === "desktop" ? item.desktop : item.mobile;
        acc[item.domain] = stratData.seo;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      category: "Accessibility",
      ...analyses.reduce((acc, item) => {
        const stratData = strategy === "desktop" ? item.desktop : item.mobile;
        acc[item.domain] = stratData.accessibility;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      category: "Best Practices",
      ...analyses.reduce((acc, item) => {
        const stratData = strategy === "desktop" ? item.desktop : item.mobile;
        acc[item.domain] = stratData.bestPractices;
        return acc;
      }, {} as Record<string, number>),
    },
  ];

  // Distinct color palette for up to 6 comparative sites
  const colors = ["#ff4dce", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#06b6d4"];

  const getScoreColor = (val: number) => {
    if (val >= 90) return "text-emerald-600 dark:text-emerald-400 font-bold";
    if (val >= 50) return "text-amber-600 dark:text-amber-400 font-bold";
    return "text-rose-600 dark:text-rose-400 font-bold";
  };

  return (
    <div id="comparison-view-container" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg">
        <div>
          <button
            type="button"
            onClick={onBackToCurrent}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#ff4dce] hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Active Audit
          </button>
          <h2 className="font-gaegu text-2xl sm:text-3xl font-bold text-[var(--ink)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#ff4dce]" />
            Multi-Site Comparative Intelligence
          </h2>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-0.5">
            Comparing metrics and Core Web Vitals across {analyses.length} analyzed targets.
          </p>
        </div>

        {/* Strategy Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm">
          <button
            type="button"
            id="compare-strategy-mobile"
            onClick={() => setStrategy("mobile")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
              strategy === "mobile"
                ? "bg-[#ff4dce] text-white border-2 border-[var(--ink)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
          <button
            type="button"
            id="compare-strategy-desktop"
            onClick={() => setStrategy("desktop")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
              strategy === "desktop"
                ? "bg-[#ff4dce] text-white border-2 border-[var(--ink)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
        </div>
      </div>

      {/* Side-by-Side Bar Chart Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg">
        <div className="mb-4">
          <h3 className="font-gaegu text-2xl font-bold text-[var(--ink)]">
            Scores Breakdown by Website ({strategy === "mobile" ? "Mobile" : "Desktop"})
          </h3>
          <p className="font-mono text-xs text-[var(--ink-muted)]">
            Higher values represent superior optimization and search readiness (scale 0-100).
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: "#cbd5e1", opacity: 0.3 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg)",
                  borderRadius: "12px",
                  border: "2px solid var(--ink)",
                  color: "var(--ink)",
                  fontSize: "12px",
                  fontFamily: "Space Mono, monospace",
                  boxShadow: "4px 4px 0px var(--ink)",
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "12px", fontFamily: "Space Mono, monospace", fontSize: "11px" }}
                iconType="circle"
                iconSize={8}
              />
              {analyses.map((item, idx) => (
                <Bar
                  key={item.id}
                  dataKey={item.domain}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  maxBarSize={45}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg overflow-hidden">
        <div className="mb-4">
          <h3 className="font-gaegu text-2xl font-bold text-[var(--ink)]">
            Direct Metric Matrix
          </h3>
          <p className="font-mono text-xs text-[var(--ink-muted)]">
            Click any column header to open that specific site's comprehensive audit.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--ink)]/20">
                <th className="pb-3 font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Metric
                </th>
                {analyses.map((item, idx) => (
                  <th key={item.id} className="pb-3 px-4 font-mono text-xs font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectAnalysis(item)}
                        className="group inline-flex items-center gap-1.5 text-[var(--ink)] hover:text-[#ff4dce] transition-colors text-left min-w-0"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-[var(--ink)] flex-shrink-0"
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                        <span className="truncate max-w-[120px]">{item.domain}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>

                      {onDeleteAnalysis && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnalysis(item.id);
                          }}
                          className="p-1 rounded text-[var(--ink-muted)] hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                          title={`Remove ${item.domain} from comparison`}
                          aria-label={`Remove ${item.domain} from comparison`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink)]/10 font-mono text-xs">
              {/* Category Scores */}
              <tr className="bg-[#fffeef]/40 dark:bg-black/20">
                <td className="py-2.5 font-bold text-[var(--ink)]">
                  Performance Score
                </td>
                {analyses.map((item) => {
                  const s = strategy === "desktop" ? item.desktop.performance : item.mobile.performance;
                  return (
                    <td key={item.id} className={`py-2.5 px-4 ${getScoreColor(s)}`}>
                      {s} / 100
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-[var(--ink)]">
                  SEO Score
                </td>
                {analyses.map((item) => {
                  const s = strategy === "desktop" ? item.desktop.seo : item.mobile.seo;
                  return (
                    <td key={item.id} className={`py-2.5 px-4 ${getScoreColor(s)}`}>
                      {s} / 100
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-[#fffeef]/40 dark:bg-black/20">
                <td className="py-2.5 font-bold text-[var(--ink)]">
                  Accessibility Score
                </td>
                {analyses.map((item) => {
                  const s = strategy === "desktop" ? item.desktop.accessibility : item.mobile.accessibility;
                  return (
                    <td key={item.id} className={`py-2.5 px-4 ${getScoreColor(s)}`}>
                      {s} / 100
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-[var(--ink)]">
                  Best Practices Score
                </td>
                {analyses.map((item) => {
                  const s = strategy === "desktop" ? item.desktop.bestPractices : item.mobile.bestPractices;
                  return (
                    <td key={item.id} className={`py-2.5 px-4 ${getScoreColor(s)}`}>
                      {s} / 100
                    </td>
                  );
                })}
              </tr>

              {/* Core Web Vitals */}
              <tr className="bg-[#ff4dce]/10 font-bold text-xs uppercase tracking-wider text-[#ff4dce]">
                <td colSpan={analyses.length + 1} className="py-2 px-1">
                  ★ Core Web Vitals & Loading
                </td>
              </tr>

              <tr>
                <td className="py-2.5 text-[var(--ink-muted)]">
                  Largest Contentful Paint (LCP)
                </td>
                {analyses.map((item) => {
                  const v = strategy === "desktop" ? item.desktop.vitals.lcp : item.mobile.vitals.lcp;
                  return (
                    <td key={item.id} className="py-2.5 px-4 font-bold text-[var(--ink)]">
                      {v?.value || "N/A"}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-[#fffeef]/40 dark:bg-black/20">
                <td className="py-2.5 text-[var(--ink-muted)]">
                  Interaction to Next Paint (INP)
                </td>
                {analyses.map((item) => {
                  const v = strategy === "desktop" ? item.desktop.vitals.inp : item.mobile.vitals.inp;
                  return (
                    <td key={item.id} className="py-2.5 px-4 font-bold text-[var(--ink)]">
                      {v?.value || "N/A"}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-2.5 text-[var(--ink-muted)]">
                  Cumulative Layout Shift (CLS)
                </td>
                {analyses.map((item) => {
                  const v = strategy === "desktop" ? item.desktop.vitals.cls : item.mobile.vitals.cls;
                  return (
                    <td key={item.id} className="py-2.5 px-4 font-bold text-[var(--ink)]">
                      {v?.value || "N/A"}
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-[#fffeef]/40 dark:bg-black/20">
                <td className="py-2.5 text-[var(--ink-muted)]">
                  Server Response Time (TTFB)
                </td>
                {analyses.map((item) => {
                  const v = strategy === "desktop" ? item.desktop.vitals.ttfb : item.mobile.vitals.ttfb;
                  return (
                    <td key={item.id} className="py-2.5 px-4 font-bold text-[var(--ink)]">
                      {v?.value || "N/A"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
