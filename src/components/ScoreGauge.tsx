import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface ScoreGaugeProps {
  score: number;
  label: string;
  sublabel?: string;
  size?: number;
  delay?: number;
}

export function ScoreGauge({
  score,
  label,
  sublabel,
  size = 124,
  delay = 0,
}: ScoreGaugeProps) {
  const [currentScore, setCurrentScore] = useState(0);

  // Smooth count-up effect
  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    if (end === 0) {
      setCurrentScore(0);
      return;
    }

    const duration = 1200; // ms
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCurrentScore(end);
          clearInterval(interval);
        } else {
          setCurrentScore(Math.round(start));
        }
      }, stepTime);
      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [score, delay]);

  // Determine color scheme based on standard Lighthouse thresholds
  const getColor = (val: number) => {
    if (val >= 90) {
      return {
        stroke: "#10b981", // emerald-500
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-[var(--ink)]",
        badge: "Good",
      };
    }
    if (val >= 50) {
      return {
        stroke: "#f59e0b", // amber-500
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-2 border-[var(--ink)]",
        badge: "Needs Work",
      };
    }
    return {
      stroke: "#ef4444", // red-500
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-2 border-[var(--ink)]",
      badge: "Poor",
    };
  };

  const color = getColor(score);

  // SVG Gauge calculations
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Sweep arc: 260 degrees arc for a modern speedometer feel
  const arcPercentage = 0.75;
  const strokeDasharray = `${circumference * arcPercentage} ${circumference}`;
  const strokeDashoffset =
    circumference * arcPercentage * (1 - currentScore / 100);

  return (
    <div
      id={`gauge-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-sm hover:brutal-shadow transition-all duration-200 group min-h-[225px]"
    >
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="text-[var(--ink-faint)] dark:text-white/10"
          />
          {/* Animated score arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference * arcPercentage }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`font-gaegu text-3xl sm:text-4xl font-bold tracking-tight leading-none ${color.text}`}>
            {currentScore}
          </span>
          <span className="font-mono text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mt-0.5">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-3 text-center w-full flex flex-col items-center flex-1 justify-between">
        <div>
          <h4 className="font-gaegu text-lg sm:text-xl font-bold text-[var(--ink)] leading-snug break-words">
            {label}
          </h4>
          {sublabel && (
            <p className="font-mono text-[10px] text-[var(--ink-muted)] mt-0.5 leading-tight">
              {sublabel}
            </p>
          )}
        </div>
        <div className="mt-2.5 flex justify-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${color.bg}`}
          >
            {color.badge}
          </span>
        </div>
      </div>
    </div>
  );
}
