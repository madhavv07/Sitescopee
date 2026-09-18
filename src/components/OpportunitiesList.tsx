import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { OpportunityItem } from "../types";

interface OpportunitiesListProps {
  opportunities: OpportunityItem[];
  seoIssues: string[];
  a11yIssues: string[];
}

export function OpportunitiesList({
  opportunities,
  seoIssues,
  a11yIssues,
}: OpportunitiesListProps) {
  const [isOpen, setIsOpen] = useState(true);

  const hasItems =
    opportunities.length > 0 || seoIssues.length > 0 || a11yIssues.length > 0;

  if (!hasItems) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border-2 border-[var(--ink)] brutal-shadow-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="font-mono text-xs font-bold">
          Zero critical performance or SEO bottlenecks detected in automated audits.
        </span>
      </div>
    );
  }

  return (
    <div
      id="diagnostics-panel"
      className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg transition-all"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start sm:items-center justify-between gap-3 text-left focus:outline-none cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="font-gaegu text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-tight">
              Technical Audit Diagnostics & Optimization Opportunities
            </h4>
            <span className="font-mono px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm flex-shrink-0">
              {opportunities.length + seoIssues.length + a11yIssues.length} found
            </span>
          </div>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
            Granular technical findings from Lighthouse audit runs.
          </p>
        </div>
        <div className="p-2 rounded-xl border-2 border-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#fff7d9] brutal-shadow-sm transition-all flex-shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-5 space-y-5 pt-4 border-t-2 border-[var(--ink)]/15">
          {opportunities.length > 0 && (
            <div>
              <h5 className="font-gaegu text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                Performance Opportunities ({opportunities.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunities.map((opp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm hover:brutal-shadow transition-all text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 mb-1.5">
                        <span className="font-gaegu text-lg font-bold text-[var(--ink)] leading-snug flex-1 min-w-0 break-words">
                          {opp.title}
                        </span>
                        {opp.displayValue && (
                          <span className="font-mono text-[11px] font-bold text-[#ff4dce] px-2 py-0.5 rounded border border-[var(--ink)] bg-white dark:bg-[#2a2a2a] whitespace-nowrap self-start flex-shrink-0">
                            {opp.displayValue}
                          </span>
                        )}
                      </div>
                      {opp.description && (
                        <p className="mt-1 text-[var(--ink-muted)] text-xs leading-relaxed">
                          {opp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {seoIssues.length > 0 && (
            <div>
              <h5 className="font-gaegu text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                SEO Audit Flags ({seoIssues.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {seoIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm font-mono text-xs font-bold text-[var(--ink)]"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-[#ff4dce]" />
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {a11yIssues.length > 0 && (
            <div>
              <h5 className="font-gaegu text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                Accessibility Remediations ({a11yIssues.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {a11yIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm font-mono text-xs font-bold text-[var(--ink)]"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-[#ff4dce]" />
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
