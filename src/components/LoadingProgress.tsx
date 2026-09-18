import { motion } from "motion/react";
import { Globe, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

interface LoadingProgressProps {
  step: number; // 1: Fetching data, 2: Analyzing performance, 3: Generating recommendations
  targetUrl: string;
}

export function LoadingProgress({ step, targetUrl }: LoadingProgressProps) {
  const steps = [
    { id: 1, label: "Fetching data...", detail: "Contacting Google PageSpeed API", icon: Globe },
    { id: 2, label: "Analyzing performance...", detail: "Auditing Core Web Vitals & SEO", icon: Cpu },
    { id: 3, label: "Generating recommendations...", detail: "Gemini AI synthesizing insights", icon: Sparkles },
  ];

  return (
    <div id="loading-progress-state" className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Target and Multi-step status indicator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff4dce] text-white border-2 border-[var(--ink)] font-mono text-xs font-bold -rotate-1 brutal-shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ★ Active Scan in Progress
          </div>
          <h3 className="font-gaegu text-3xl sm:text-4xl font-bold text-[var(--ink)]">
            Inspecting <span className="text-[#ff4dce] underline decoration-wavy underline-offset-4">{targetUrl}</span>
          </h3>
          <p className="font-mono text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            Simulating real-world user devices, capturing network waterfalls, and computing Google Core Web Vitals.
          </p>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((s) => {
            const isDone = step > s.id;
            const isCurrent = step === s.id;
            const Icon = s.icon;

            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-2xl border-2 border-[var(--ink)] transition-all duration-200 text-left flex items-center gap-3 ${
                  isDone
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 brutal-shadow-sm"
                    : isCurrent
                    ? "bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] brutal-shadow"
                    : "bg-white/40 dark:bg-black/20 text-[var(--ink-muted)] opacity-60"
                }`}
              >
                <div
                  className={`p-2 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center flex-shrink-0 ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-[#ff4dce] text-white animate-pulse"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="font-gaegu text-lg font-bold block truncate leading-none">{s.label}</span>
                  <span className="font-mono text-[10px] opacity-80 block truncate mt-0.5">{s.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shimmering Loading bar */}
        <div className="w-full bg-[#fffeef] dark:bg-[#1c1b22] rounded-full h-3 overflow-hidden relative border-2 border-[var(--ink)] brutal-shadow-sm">
          <motion.div
            className="h-full bg-[#ff4dce]"
            initial={{ width: "15%" }}
            animate={{
              width: step === 1 ? "35%" : step === 2 ? "70%" : "95%",
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Shimmer Skeleton Dashboard representation */}
      <div className="space-y-6 opacity-60 select-none pointer-events-none">
        {/* 4 Skeleton Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-24 h-24 rounded-full border-8 border-[var(--ink-faint)] animate-pulse" />
              <div className="w-20 h-4 bg-[var(--ink-faint)] rounded animate-pulse" />
              <div className="w-14 h-3 bg-[var(--ink-faint)] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* 3 Skeleton Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 bg-[var(--ink-faint)] rounded animate-pulse" />
                <div className="w-12 h-5 bg-[var(--ink-faint)] rounded-full animate-pulse" />
              </div>
              <div className="w-28 h-8 bg-[var(--ink-faint)] rounded animate-pulse" />
              <div className="w-full h-3 bg-[var(--ink-faint)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
