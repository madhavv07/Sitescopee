import { useState } from "react";
import { HelpCircle, Clock, Zap, Move, Server, Compass } from "lucide-react";
import { CoreWebVitals } from "../types";

interface CoreWebVitalsProps {
  vitals: CoreWebVitals;
}

interface VitalCardConfig {
  id: string;
  name: string;
  shortCode: string;
  value: string;
  rating?: "Good" | "Needs Improvement" | "Poor";
  goodThreshold: string;
  poorThreshold: string;
  unit: string;
  icon: typeof Clock;
  description: string;
  impact: string;
}

export function CoreWebVitalsSection({ vitals }: CoreWebVitalsProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const cards: VitalCardConfig[] = [
    {
      id: "vital-lcp",
      name: "Largest Contentful Paint",
      shortCode: "LCP",
      value: vitals.lcp?.value || "N/A",
      rating: vitals.lcp?.rating || "Good",
      goodThreshold: "≤ 2.5s",
      poorThreshold: "> 4.0s",
      unit: "Loading speed",
      icon: Clock,
      description:
        "Measures perceived loading speed. It marks the point in the page load timeline when the primary content (hero image, headline, or video) has likely loaded.",
      impact: "Critical for reducing initial visitor bounce rates.",
    },
    {
      id: "vital-inp",
      name: "Interaction to Next Paint",
      shortCode: "INP",
      value: vitals.inp?.value || "N/A",
      rating: vitals.inp?.rating || "Good",
      goodThreshold: "≤ 200ms",
      poorThreshold: "> 500ms",
      unit: "Responsiveness",
      icon: Zap,
      description:
        "Measures page responsiveness to all user interactions (clicks, taps, and key presses) throughout the entire user visit.",
      impact: "Replaced FID in Google ranking factors to assess true interaction latency.",
    },
    {
      id: "vital-cls",
      name: "Cumulative Layout Shift",
      shortCode: "CLS",
      value: vitals.cls?.value || "0.00",
      rating: vitals.cls?.rating || "Good",
      goodThreshold: "≤ 0.1",
      poorThreshold: "> 0.25",
      unit: "Visual stability",
      icon: Move,
      description:
        "Measures visual stability. It quantifies how often users experience unexpected layout shifts as elements and dynamic banners render on screen.",
      impact: "Prevents accidental clicks on wrong buttons and enhances user trust.",
    },
  ];

  const getRatingStyle = (rating?: string) => {
    switch (rating) {
      case "Good":
        return {
          pill: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-[var(--ink)]",
          dot: "bg-emerald-500",
        };
      case "Needs Improvement":
        return {
          pill: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-2 border-[var(--ink)]",
          dot: "bg-amber-500",
        };
      case "Poor":
      default:
        return {
          pill: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-2 border-[var(--ink)]",
          dot: "bg-rose-500",
        };
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-gaegu text-2xl sm:text-3xl font-bold text-[var(--ink)] flex items-center gap-2.5 flex-wrap">
            Core Web Vitals
            <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm font-bold">
              Google Signals
            </span>
          </h3>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
            Key user experience metrics that directly influence search rankings and user satisfaction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const style = getRatingStyle(card.rating);
          const Icon = card.icon;
          const isTooltipOpen = activeTooltip === card.id;

          return (
            <div
              key={card.id}
              id={card.id}
              className="relative p-5 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-sm hover:brutal-shadow transition-all duration-200 group"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] text-[#ff4dce] flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
                      {card.shortCode}
                    </span>
                    <h4 className="font-gaegu text-lg sm:text-xl font-bold text-[var(--ink)] leading-snug break-words">
                      {card.name}
                    </h4>
                  </div>
                </div>

                {/* Tooltip trigger button */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    id={`info-btn-${card.shortCode.toLowerCase()}`}
                    onMouseEnter={() => setActiveTooltip(card.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() =>
                      setActiveTooltip(isTooltipOpen ? null : card.id)
                    }
                    className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                    aria-label={`Info about ${card.name}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  {/* Tooltip Card */}
                  {isTooltipOpen && (
                    <div className="absolute right-0 top-7 z-30 w-72 p-3.5 rounded-xl bg-white dark:bg-[#1c1b22] text-[var(--ink)] border-2 border-[var(--ink)] brutal-shadow-lg text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <p className="font-gaegu text-base font-bold">{card.name}</p>
                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{card.description}</p>
                      <div className="pt-1 border-t border-[var(--ink)]/20 font-mono text-[11px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Good: {card.goodThreshold}</span> |{" "}
                        <span className="font-bold text-rose-600 dark:text-rose-400">Poor: {card.poorThreshold}</span>
                      </div>
                      <p className="font-mono text-[11px] text-[#ff4dce] font-bold">{card.impact}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Value and Rating */}
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-gaegu text-3xl sm:text-4xl font-bold text-[var(--ink)] tracking-tight">
                    {card.value}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--ink-muted)] ml-1.5 font-bold">
                    {card.unit}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold flex-shrink-0 ${style.pill}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {card.rating}
                </span>
              </div>

              {/* Baseline Threshold indicator bar */}
              <div className="mt-4 pt-3 border-t border-[var(--ink)]/15 flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
                <span>Target: {card.goodThreshold}</span>
                <span className="text-[#ff4dce] font-bold">Google CWV</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Web Performance Vitals */}
      {(vitals.fcp || vitals.ttfb || vitals.speedIndex) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {vitals.fcp && (
            <div className="p-3 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border border-[var(--ink)] text-[#ff4dce] flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-[var(--ink-muted)] block font-bold leading-tight truncate">First Contentful Paint</span>
                <span className="font-gaegu text-lg sm:text-xl font-bold text-[var(--ink)] leading-tight block mt-0.5 truncate">{vitals.fcp.value}</span>
              </div>
            </div>
          )}
          {vitals.ttfb && (
            <div className="p-3 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border border-[var(--ink)] text-[#ff4dce] flex-shrink-0">
                <Server className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-[var(--ink-muted)] block font-bold leading-tight truncate">Server Response (TTFB)</span>
                <span className="font-gaegu text-lg sm:text-xl font-bold text-[var(--ink)] leading-tight block mt-0.5 truncate">{vitals.ttfb.value}</span>
              </div>
            </div>
          )}
          {vitals.speedIndex && (
            <div className="p-3 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border border-[var(--ink)] text-[#ff4dce] flex-shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-[var(--ink-muted)] block font-bold leading-tight truncate">Speed Index</span>
                <span className="font-gaegu text-lg sm:text-xl font-bold text-[var(--ink)] leading-tight block mt-0.5 truncate">{vitals.speedIndex.value}</span>
              </div>
            </div>
          )}
          {vitals.tbt && (
            <div className="p-3 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border border-[var(--ink)] text-[#ff4dce] flex-shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-[var(--ink-muted)] block font-bold leading-tight truncate">Total Blocking Time</span>
                <span className="font-gaegu text-lg sm:text-xl font-bold text-[var(--ink)] leading-tight block mt-0.5 truncate">{vitals.tbt.value}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
