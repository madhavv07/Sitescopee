import { useState } from "react";
import {
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  Copy,
  Check,
  Code2,
  FileDown,
  Zap,
  FolderTree,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { AIInsights } from "../types";

interface AIInsightsCardProps {
  insights: AIInsights;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onOpenContact?: () => void;
  isUnlocked?: boolean;
  onUnlockClick?: () => void;
}

export function AIInsightsCard({
  insights,
  onRegenerate,
  isRegenerating,
  onOpenContact,
  isUnlocked = false,
  onUnlockClick,
}: AIInsightsCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getPriorityBadge = (priority: "High" | "Medium" | "Low") => {
    switch (priority) {
      case "High":
        return {
          badge: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-2 border-[var(--ink)]",
          icon: AlertCircle,
        };
      case "Medium":
        return {
          badge: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-2 border-[var(--ink)]",
          icon: AlertTriangle,
        };
      case "Low":
      default:
        return {
          badge: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-2 border-[var(--ink)]",
          icon: CheckCircle2,
        };
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Performance":
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-[var(--ink)]";
      case "SEO":
        return "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-2 border-[var(--ink)]";
      case "Accessibility":
        return "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-2 border-[var(--ink)]";
      case "Best Practices":
      default:
        return "bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-2 border-[var(--ink)]";
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const allRecommendations = insights.recommendations || [];
  // Free preview shows the 1st recommendation with full code and insertion guide; remaining are locked behind ₹10
  const visibleRecommendations = isUnlocked
    ? allRecommendations
    : allRecommendations.slice(0, 1);
  const lockedCount = Math.max(0, allRecommendations.length - 1);
  const remainingRecommendations = allRecommendations.slice(1);

  return (
    <div
      id="ai-insights-panel"
      className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg space-y-6 print:border-none print:shadow-none print:p-0"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b-2 border-[var(--ink)]/15">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-gaegu text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-tight">
                Gemini SEO & Performance Intelligence
              </h3>
              {isUnlocked ? (
                <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500 text-white border-2 border-[var(--ink)] brutal-shadow-sm font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Unlocked (₹10 Paid)
                </span>
              ) : (
                <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm font-bold">
                  AI Solutions & Code
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
              Production-ready code fixes, exact file insertion locations, and Google SEO ranking factors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {isUnlocked && (
            <button
              type="button"
              id="export-pdf-btn"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs font-bold rounded-xl text-white bg-[var(--ink)] hover:bg-[var(--ink)]/80 border-2 border-[var(--ink)] brutal-shadow-sm transition-all cursor-pointer print:hidden"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download / Print PDF
            </button>
          )}

          {onRegenerate && (
            <button
              type="button"
              id="regenerate-insights-btn"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs font-bold rounded-xl text-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-[#fff7d9] border-2 border-[var(--ink)] brutal-shadow-sm transition-all disabled:opacity-50 print:hidden cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-[#ff4dce]" : "text-[#ff4dce]"}`} />
              {isRegenerating ? "Re-analyzing..." : "Refresh Insights"}
            </button>
          )}
        </div>
      </div>

      {/* Executive Summary Card (Free for all) */}
      <div className="p-5 rounded-2xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ff4dce]">
            ★ Executive Health Summary
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            Free Preview
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--ink)] font-medium">
          {insights.summary}
        </p>
      </div>

      {/* Prioritized Recommendations with Code & Insertion Guides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-gaegu text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-tight">
            Prioritized Technical Action Plan ({allRecommendations.length})
          </h4>
          <span className="font-mono text-xs text-[var(--ink-muted)] font-bold">
            {isUnlocked ? "Full Access Unlocked" : "1 of " + allRecommendations.length + " Free Preview (Code Included)"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {visibleRecommendations.map((rec, index) => {
            const priorityCfg = getPriorityBadge(rec.priority);
            const PriorityIcon = priorityCfg.icon;
            const categoryClass = getCategoryBadge(rec.category);

            return (
              <div
                key={index}
                id={`rec-item-${index + 1}`}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#222129] border-2 border-[var(--ink)] brutal-shadow-sm hover:brutal-shadow transition-all space-y-4 text-left"
              >
                {/* Meta row - wrapped cleanly with gap-y-2 */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--ink)] text-[var(--bg)] font-mono flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${priorityCfg.badge}`}
                    >
                      <PriorityIcon className="w-3.5 h-3.5" />
                      {rec.priority} Priority
                    </span>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${categoryClass}`}
                    >
                      {rec.category}
                    </span>
                  </div>

                  {rec.effort && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] border border-[var(--ink)]">
                      Effort: {rec.effort}
                    </span>
                  )}
                </div>

                {/* Title with clean vertical rhythm and leading */}
                <h5 className="font-gaegu text-xl sm:text-2xl font-bold text-[var(--ink)] leading-snug break-words">
                  {rec.title}
                </h5>

                {/* Engineering Action */}
                <div className="p-3.5 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border border-[var(--ink)]">
                  <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed font-medium">
                    {rec.action}
                  </p>
                </div>

                {/* WHERE TO INSERT THAT CODE (File + Location Guide) */}
                {(rec.targetFile || rec.insertionGuide) && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-800 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Target File:
                      </span>
                      <code className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-[#1c1b22] text-indigo-700 dark:text-indigo-300 border border-indigo-400">
                        {rec.targetFile || "index.html"}
                      </code>
                    </div>

                    {rec.insertionGuide && (
                      <div className="flex items-start gap-2 pt-1 border-t border-indigo-200 dark:border-indigo-800/60 font-mono text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                        <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="font-bold">Where to insert:</strong> {rec.insertionGuide}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* GOOGLE SEO RANKING FACTOR */}
                {rec.seoRankingImpact && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="font-mono text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      <strong className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                        Google SEO Ranking Factor:
                      </strong>{" "}
                      {rec.seoRankingImpact}
                    </div>
                  </div>
                )}

                {/* Expected Core Web Vitals Impact */}
                {rec.impact && (
                  <div className="flex items-start gap-1.5 font-mono text-xs text-[#ff4dce] font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Expected Metric Impact: {rec.impact}</span>
                  </div>
                )}

                {/* READY-TO-USE CODE FIX SNIPPET */}
                {rec.codeSnippet && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--ink)]">
                        <Code2 className="w-4 h-4 text-[#ff4dce]" />
                        <span>Ready-to-Use Code Fix ({rec.codeLanguage || "html"}):</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(rec.codeSnippet!, index)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-mono text-xs font-bold text-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-[#fff7d9] border border-[var(--ink)] transition-all cursor-pointer"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-[#1c1b22] text-slate-100 font-mono text-xs overflow-x-auto border-2 border-[var(--ink)] leading-relaxed shadow-inner">
                      <code>{rec.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* LOCKED TEASER SECTION (When Unpaid) */}
        {!isUnlocked && lockedCount > 0 && (
          <div className="relative mt-5 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#fffeef] via-[#fff5fb] to-[#f0e6ff] dark:from-[#222129] dark:to-[#1c1b22] border-3 border-[var(--ink)] brutal-shadow space-y-5 overflow-hidden text-left">
            {/* Background decorative lock */}
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-[var(--ink)]">
              <Lock className="w-48 h-48" />
            </div>

            {/* Teaser Headline */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4dce] text-white font-mono text-xs font-bold border-2 border-[var(--ink)] brutal-shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                <span>{lockedCount} High-Impact Code Solutions Locked</span>
              </div>
              <h4 className="font-gaegu text-3xl sm:text-4xl font-bold text-[var(--ink)] leading-tight">
                Unlock Complete Code Solutions & Insertion Locations
              </h4>
              <p className="font-mono text-xs text-[var(--ink-muted)] max-w-xl leading-relaxed">
                Get exact copy-paste code fixes (HTML, CSS, JSON-LD schemas, Next.js configs, Apache/Nginx rules), exact line-by-line file insertion guides, Google SEO ranking boosts, and downloadable PDF audit report.
              </p>
            </div>

            {/* Preview of Locked Recommendations with Titles */}
            <div className="space-y-2.5">
              {remainingRecommendations.map((lockedRec, lIdx) => (
                <div
                  key={lIdx}
                  className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1c1b22]/80 border-2 border-[var(--ink)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Lock className="w-4 h-4 text-[#ff4dce] flex-shrink-0" />
                    <span className="font-gaegu text-lg font-bold text-[var(--ink)] truncate">
                      {lIdx + 2}. {lockedRec.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                      {lockedRec.targetFile || "Code fix included"}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      SEO Ranking Factor
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ₹10 Paywall Callout & Button */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-[var(--ink)]/15">
              <div>
                <span className="font-mono text-[11px] text-[var(--ink-muted)] font-bold uppercase tracking-wider block">
                  Single Audit Unlock
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-gaegu text-4xl font-bold text-[var(--ink)]">₹10</span>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    One-time payment • Instant UPI unlock
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="unlock-audit-btn"
                onClick={onUnlockClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#ff4dce] hover:bg-[#e038b3] text-white font-gaegu text-2xl font-bold border-3 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-5 h-5" />
                <span>Pay ₹10 & Unlock All Code Solutions</span>
              </button>
            </div>
          </div>
        )}

        {/* 'Want to improve this all?' Contact Madhav Gajjar Callout */}
        {onOpenContact && (
          <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#fffeef] dark:bg-[#1c1b22] border-3 border-[var(--ink)] brutal-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1 text-left">
              <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#ff4dce] uppercase tracking-wider">
                ★ Ready to optimize?
              </div>
              <h4 className="font-gaegu text-2xl font-bold text-[var(--ink)] leading-tight">
                Want to improve all of these recommendations?
              </h4>
              <p className="font-mono text-xs text-[var(--ink-muted)]">
                Get hands-on performance engineering & SEO fixes from Madhav Gajjar.
              </p>
            </div>
            <button
              type="button"
              id="improve-all-contact-btn"
              onClick={onOpenContact}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all font-mono text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Contact Madhav Gajjar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
