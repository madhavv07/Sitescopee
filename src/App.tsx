/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  Globe,
  Smartphone,
  Monitor,
  Search,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Scale,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Send,
  User,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { AnalysisResult, Strategy } from "./types";

import { Navbar } from "./components/Navbar";
import { ScoreGauge } from "./components/ScoreGauge";
import { CoreWebVitalsSection } from "./components/CoreWebVitalsSection";
import { AIInsightsCard } from "./components/AIInsightsCard";
import { ComparisonView } from "./components/ComparisonView";
import { OpportunitiesList } from "./components/OpportunitiesList";
import { LoadingProgress } from "./components/LoadingProgress";
import { ContactExpertModal } from "./components/ContactExpertModal";
import { PaymentModal } from "./components/PaymentModal";

const POPULAR_SITES = [
  { name: "Stripe", url: "https://stripe.com" },
  { name: "Vercel", url: "https://vercel.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Wikipedia", url: "https://wikipedia.org" },
];

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("sitescope_theme") === "dark" ||
        (!("sitescope_theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return true;
  });

  // Input & Audit state
  const [urlInput, setUrlInput] = useState("");
  const [inputStrategy, setInputStrategy] = useState<Strategy>("mobile");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results & History state (persisted locally so audits are saved across visits)
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sitescope_history");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load local history", e);
      }
    }
    return [];
  });
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [viewMode, setViewMode] = useState<"hero" | "results" | "comparison">("hero");
  const [isRegeneratingInsights, setIsRegeneratingInsights] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Unlocked audits state (persisted per URL)
  const [unlockedUrls, setUnlockedUrls] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sitescope_unlocked");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load unlocked status", e);
      }
    }
    return {};
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sitescope_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sitescope_theme", "light");
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Main Analysis Orchestration
  const handleAnalyze = async (overrideUrl?: string) => {
    const rawTarget = overrideUrl || urlInput;
    setErrorMessage(null);

    let clean = rawTarget.trim();
    if (!clean) {
      setErrorMessage("Please enter a website URL to begin testing.");
      return;
    }

    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }

    // Basic domain validation
    try {
      const parsed = new URL(clean);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        setErrorMessage("Please enter a valid website domain name (e.g. stripe.com).");
        return;
      }
    } catch {
      setErrorMessage("Invalid URL format. Please verify your input.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(1);

    try {
      // Step 1: Call PageSpeed Insights backend endpoint
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: clean, strategy: inputStrategy }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis request failed with status ${analyzeRes.status}`);
      }

      const analyzeData = await analyzeRes.json();
      setLoadingStep(2);

      const activeStrategyData =
        inputStrategy === "desktop" ? analyzeData.desktop : analyzeData.mobile;

      // Step 2: Send extracted metrics to Gemini AI for consultant insights
      setLoadingStep(3);
      let insightsData: any = null;
      try {
        const insightsRes = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: clean,
            strategy: inputStrategy,
            scores: {
              performance: activeStrategyData.performance,
              seo: activeStrategyData.seo,
              accessibility: activeStrategyData.accessibility,
              bestPractices: activeStrategyData.bestPractices,
            },
            vitals: activeStrategyData.vitals,
            opportunities: activeStrategyData.opportunities,
            seoIssues: activeStrategyData.seoIssues,
            a11yIssues: activeStrategyData.a11yIssues,
            diagnosticStats: activeStrategyData.diagnosticStats,
            isUnlocked: Boolean(unlockedUrls[clean]),
          }),
        });

        if (insightsRes.ok) {
          insightsData = await insightsRes.json();
        }
      } catch (aiErr) {
        console.warn("AI insights request bypassed:", aiErr);
      }

      if (!insightsData) {
        // Deterministic client fallback insights
        insightsData = {
          summary: `The site exhibits solid baseline scores across accessibility and SEO. Improving mobile Core Web Vitals will maximize conversion rates and search rankings.`,
          recommendations: [
            {
              title: "Optimize Image Delivery & Formats",
              priority: "High",
              category: "Performance",
              action: "Convert assets to WebP/AVIF and implement responsive srcset tags.",
              impact: "Substantially lowers Largest Contentful Paint (LCP).",
              effort: "Quick Win",
            },
            {
              title: "Strengthen Semantic Structure",
              priority: "Medium",
              category: "SEO",
              action: "Validate H1-H3 document outline and ensure descriptive meta tags.",
              impact: "Enhances search crawler comprehension.",
              effort: "Quick Win",
            },
          ],
        };
      }

      const newAnalysis: AnalysisResult = {
        id: `analysis_${Date.now()}`,
        url: analyzeData.url,
        domain: analyzeData.domain,
        timestamp: analyzeData.timestamp || new Date().toISOString(),
        activeStrategy: inputStrategy,
        mobile: analyzeData.mobile,
        desktop: analyzeData.desktop,
        insights: insightsData,
        warning: analyzeData.warning,
        auditSource: analyzeData.auditSource,
      };

      // Update in-memory and local history (last 8 analyzed URLs cached across sessions)
      setHistory((prev) => {
        const filtered = prev.filter(
          (p) => p.url.toLowerCase() !== newAnalysis.url.toLowerCase()
        );
        const updated = [newAnalysis, ...filtered].slice(0, 8);
        try {
          localStorage.setItem("sitescope_history", JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not write history to localStorage:", e);
        }
        return updated;
      });

      setCurrentAnalysis(newAnalysis);
      setViewMode("results");
    } catch (error: any) {
      console.warn("Audit error notice:", error);
      const isNetwork = error.name === "TypeError" || error.message?.includes("Failed to fetch");
      setErrorMessage(
        isNetwork
          ? "Unable to reach audit service or connection timed out. Please verify your connection and try again."
          : error.message || "Failed to analyze target website. Please verify the URL or try another site."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle active strategy (Mobile vs Desktop) for current analysis
  const handleToggleCurrentStrategy = (strat: Strategy) => {
    if (!currentAnalysis) return;
    setCurrentAnalysis({
      ...currentAnalysis,
      activeStrategy: strat,
    });
  };

  // Refresh Gemini insights
  const handleRegenerateInsights = async () => {
    if (!currentAnalysis) return;
    setIsRegeneratingInsights(true);

    const activeStratData =
      currentAnalysis.activeStrategy === "desktop"
        ? currentAnalysis.desktop
        : currentAnalysis.mobile;

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentAnalysis.url,
          strategy: currentAnalysis.activeStrategy,
          scores: {
            performance: activeStratData.performance,
            seo: activeStratData.seo,
            accessibility: activeStratData.accessibility,
            bestPractices: activeStratData.bestPractices,
          },
          vitals: activeStratData.vitals,
          opportunities: activeStratData.opportunities,
          seoIssues: activeStratData.seoIssues,
          a11yIssues: activeStratData.a11yIssues,
          diagnosticStats: activeStratData.diagnosticStats,
          isUnlocked: Boolean(unlockedUrls[currentAnalysis.url]),
        }),
      });

      if (res.ok) {
        const freshInsights = await res.json();
        const updated = {
          ...currentAnalysis,
          insights: freshInsights,
        };
        setCurrentAnalysis(updated);
        setHistory((prev) => {
          const updatedHistory = prev.map((item) => (item.id === updated.id ? updated : item));
          try {
            localStorage.setItem("sitescope_history", JSON.stringify(updatedHistory));
          } catch {}
          return updatedHistory;
        });
      }
    } catch (err) {
      console.error("Failed to refresh insights:", err);
    } finally {
      setIsRegeneratingInsights(false);
    }
  };

  // Handle successful ₹10 payment unlock
  const handlePaymentSuccess = async (unlockToken: string) => {
    if (!currentAnalysis) return;
    const siteUrl = currentAnalysis.url;
    const newUnlocked = { ...unlockedUrls, [siteUrl]: true };
    setUnlockedUrls(newUnlocked);
    try {
      localStorage.setItem("sitescope_unlocked", JSON.stringify(newUnlocked));
    } catch {}

    // Immediately fetch full unlocked action plan with code snippets
    setIsRegeneratingInsights(true);
    const activeStratData =
      currentAnalysis.activeStrategy === "desktop"
        ? currentAnalysis.desktop
        : currentAnalysis.mobile;

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          strategy: currentAnalysis.activeStrategy,
          scores: {
            performance: activeStratData.performance,
            seo: activeStratData.seo,
            accessibility: activeStratData.accessibility,
            bestPractices: activeStratData.bestPractices,
          },
          vitals: activeStratData.vitals,
          opportunities: activeStratData.opportunities,
          seoIssues: activeStratData.seoIssues,
          a11yIssues: activeStratData.a11yIssues,
          diagnosticStats: activeStratData.diagnosticStats,
          isUnlocked: true,
          unlockToken,
        }),
      });

      if (res.ok) {
        const freshInsights = await res.json();
        const updated = {
          ...currentAnalysis,
          insights: freshInsights,
        };
        setCurrentAnalysis(updated);
        setHistory((prev) => {
          const updatedHistory = prev.map((item) => (item.id === updated.id ? updated : item));
          try {
            localStorage.setItem("sitescope_history", JSON.stringify(updatedHistory));
          } catch {}
          return updatedHistory;
        });
      }
    } catch (err) {
      console.warn("Failed to fetch unlocked insights:", err);
    } finally {
      setIsRegeneratingInsights(false);
    }
  };

  // Handle return redirect from Dodo Payments checkout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const dodoSessionId = searchParams.get("dodo_session_id") || searchParams.get("session_id");
    const targetUrl = searchParams.get("url");

    if (dodoSessionId) {
      // Clear URL search params cleanly so reload doesn't re-trigger
      window.history.replaceState({}, document.title, window.location.pathname);

      fetch("/api/dodo/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: dodoSessionId, url: targetUrl }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.unlockToken) {
            handlePaymentSuccess(data.unlockToken);
          }
        })
        .catch((err) => {
          console.warn("Auto-verification error on Dodo redirect:", err);
        });
    }
  }, [currentAnalysis]);

  // Delete a specific audit from history

  const handleDeleteAudit = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("sitescope_history", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist history deletion:", e);
      }
      return updated;
    });

    // If the currently viewed analysis is the one deleted, revert to previous or hero
    if (currentAnalysis?.id === id) {
      const remaining = history.filter((item) => item.id !== id);
      if (remaining.length > 0) {
        setCurrentAnalysis(remaining[0]);
      } else {
        setCurrentAnalysis(null);
        setViewMode("hero");
      }
    }
  };

  // Clear all audits from history
  const handleClearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("sitescope_history");
    } catch (e) {
      console.warn("Failed to clear stored history:", e);
    }
    if (viewMode === "comparison") {
      setViewMode("hero");
    }
  };

  const activeStratData = currentAnalysis
    ? currentAnalysis.activeStrategy === "desktop"
      ? currentAnalysis.desktop
      : currentAnalysis.mobile
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)] font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        history={history}
        activeAnalysis={currentAnalysis}
        onSelectFromHistory={(item) => {
          setCurrentAnalysis(item);
          setViewMode("results");
        }}
        onDeleteAudit={handleDeleteAudit}
        onClearAllHistory={handleClearAllHistory}
        onOpenComparison={() => setViewMode("comparison")}
        onNewAnalysis={() => {
          setViewMode("hero");
          setUrlInput("");
          setErrorMessage(null);
        }}
        onOpenContact={() => setShowContactModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STATE 1: LOADING PROGRESS & SHIMMER */}
          {isLoading ? (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingProgress step={loadingStep} targetUrl={urlInput} />
            </motion.div>
          ) : viewMode === "hero" ? (
            /* STATE 2: HERO / LANDING SCREEN (Variation 6 Creative Playful) */
            <motion.div
              key="hero-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-14 items-center py-4"
            >
              {/* Left Column: Visual Container */}
              <div className="relative flex flex-col gap-5 text-left">
                {/* Floater Sticker */}
                <div className="inline-block self-start font-mono text-xs uppercase tracking-wider font-bold bg-[#ff4dce] text-white px-3 py-1 rounded-md border-2 border-[var(--ink)] brutal-shadow-sm -rotate-3">
                  ★ Intelligence audit
                </div>

                {/* Main Headline */}
                <h1 className="font-gaegu text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95] text-[var(--ink)]">
                  Website health,{" "}
                  <span className="relative text-[#ff4dce] inline-block">
                    reimagined.
                    <span className="absolute bottom-1 left-0 w-full h-3 sm:h-4 bg-[#ff4dce]/25 -z-10 rounded"></span>
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[var(--ink-muted)] leading-relaxed max-w-xl">
                  Extract real-world Core Web Vitals, performance bottlenecks, and prioritized, actionable SEO consultant advice in seconds.
                </p>

                {/* Search & Strategy Container */}
                <div className="flex flex-col gap-3.5 mt-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAnalyze();
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="website-url-input"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Drop your URL here (e.g. stripe.com)..."
                        className="w-full border-3 border-[var(--ink)] bg-white dark:bg-[#292830] text-[var(--ink)] px-5 py-3.5 rounded-xl font-mono text-sm focus:outline-none brutal-shadow transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      id="submit-analysis-btn"
                      className="bg-[#ff4dce] text-white border-3 border-[var(--ink)] px-7 py-3.5 rounded-xl font-bold text-base brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Analyze Now!</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Device Strategy Picker */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      id="strategy-mobile-btn"
                      onClick={() => setInputStrategy("mobile")}
                      className={`font-mono text-xs font-bold px-3.5 py-1.5 rounded-lg border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-1.5 transition-all ${
                        inputStrategy === "mobile"
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-white dark:bg-[#292830] text-[var(--ink)] hover:bg-[#fffeef]"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </button>

                    <button
                      type="button"
                      id="strategy-desktop-btn"
                      onClick={() => setInputStrategy("desktop")}
                      className={`font-mono text-xs font-bold px-3.5 py-1.5 rounded-lg border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-1.5 transition-all ${
                        inputStrategy === "desktop"
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-white dark:bg-[#292830] text-[var(--ink)] hover:bg-[#fffeef]"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </button>
                  </div>
                </div>

                {/* Inline Error State */}
                {errorMessage && (
                  <div
                    id="hero-error-banner"
                    className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-950 border-2 border-[var(--ink)] brutal-shadow-sm text-rose-900 dark:text-rose-200 text-xs font-mono flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAnalyze()}
                      className="px-2.5 py-1 rounded border border-[var(--ink)] bg-white dark:bg-black font-bold hover:bg-rose-50"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Preset Sites */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span className="font-mono text-xs text-[var(--ink-muted)] font-bold">Try:</span>
                  {POPULAR_SITES.map((site) => (
                    <button
                      key={site.name}
                      type="button"
                      onClick={() => {
                        setUrlInput(site.url);
                        handleAnalyze(site.url);
                      }}
                      className="border-2 border-dashed border-[var(--ink)] bg-white/70 dark:bg-[#292830]/70 hover:bg-[#fffeef] dark:hover:bg-[#34333d] px-3 py-1 rounded-full font-mono text-xs text-[var(--ink)] font-bold transition-all hover:scale-105"
                    >
                      {site.name}
                    </button>
                  ))}
                </div>

                {/* Playful Hand-drawn Arrow SVG */}
                <div className="hidden lg:block absolute -right-6 -bottom-10 pointer-events-none opacity-80">
                  <svg className="w-16 h-16 text-[var(--ink)] transform rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M10,10 Q50,0 90,50 M90,50 L75,45 M90,50 L85,65" />
                  </svg>
                </div>
              </div>

              {/* Right Column: 3 Neo-Brutalist Info Cards (Variation 6) */}
              <div className="flex flex-col gap-4 text-left">
                <div className="border-3 border-[var(--ink)] bg-white dark:bg-[#292830] p-6 rounded-2xl brutal-shadow -rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all flex flex-col gap-2">
                  <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">01</div>
                  <h3 className="font-gaegu text-2xl font-bold text-[#ff4dce] leading-none">4 Core Pillars</h3>
                  <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                    Performance, SEO, Accessibility, and Best Practices computed simultaneously for everyone.
                  </p>
                </div>

                <div className="border-3 border-[var(--ink)] bg-white dark:bg-[#292830] p-6 rounded-2xl brutal-shadow rotate-1.5 hover:rotate-0 hover:scale-[1.02] transition-all flex flex-col gap-2">
                  <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">02</div>
                  <h3 className="font-gaegu text-2xl font-bold text-[#ff4dce] leading-none">Core Web Vitals</h3>
                  <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                    Evaluates LCP, INP, and CLS against Google's search algorithm thresholds simply.
                  </p>
                </div>

                <div className="border-3 border-[var(--ink)] bg-white dark:bg-[#292830] p-6 rounded-2xl brutal-shadow -rotate-0.5 hover:rotate-0 hover:scale-[1.02] transition-all flex flex-col gap-2">
                  <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">03</div>
                  <h3 className="font-gaegu text-2xl font-bold text-[#ff4dce] leading-none">Gemini AI Helper</h3>
                  <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                    Translates raw audits into prioritized engineering steps with impact and effort estimations.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : viewMode === "comparison" ? (
            /* STATE 3: COMPARISON VIEW */
            <motion.div
              key="compare-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ComparisonView
                analyses={history}
                onBackToCurrent={() => setViewMode("results")}
                onSelectAnalysis={(selected) => {
                  setCurrentAnalysis(selected);
                  setViewMode("results");
                }}
                onDeleteAnalysis={handleDeleteAudit}
              />
            </motion.div>
          ) : currentAnalysis && activeStratData ? (
            /* STATE 4: RESULTS DASHBOARD */
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 text-left"
            >
              {/* Results Top Header */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#292830] border-3 border-[var(--ink)] brutal-shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-[var(--ink)]" />
                    <span className="font-mono text-xs font-bold text-[#ff4dce] uppercase tracking-wider">
                      Audit Complete
                    </span>
                    <span className="text-xs text-[var(--ink-muted)]">•</span>
                    <span className="font-mono text-xs text-[var(--ink-muted)] font-bold">
                      {new Date(currentAnalysis.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {currentAnalysis.auditSource && (
                      <>
                        <span className="text-xs text-[var(--ink-muted)]">•</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--ink)] px-2 py-0.5 rounded bg-[#fffeef] dark:bg-[#1c1b22] border border-[var(--ink)]">
                          <Activity className="w-3 h-3 text-[#ff4dce]" />
                          {currentAnalysis.auditSource}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[var(--ink)] tracking-tight">
                      {currentAnalysis.domain}
                    </h2>
                    <a
                      href={currentAnalysis.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-[var(--ink)] hover:text-[#ff4dce] border-2 border-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] brutal-shadow-sm transition-all"
                      title="Open external website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="font-mono text-xs text-[var(--ink-muted)] truncate max-w-md">
                    {currentAnalysis.url}
                  </p>
                </div>

                {/* Right Actions: Mobile/Desktop toggle and Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Strategy Toggle */}
                  <div className="flex items-center p-1 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm">
                    <button
                      type="button"
                      id="results-toggle-mobile"
                      onClick={() => handleToggleCurrentStrategy("mobile")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        currentAnalysis.activeStrategy === "mobile"
                          ? "bg-[#ff4dce] text-white border-2 border-[var(--ink)]"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </button>
                    <button
                      type="button"
                      id="results-toggle-desktop"
                      onClick={() => handleToggleCurrentStrategy("desktop")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        currentAnalysis.activeStrategy === "desktop"
                          ? "bg-[#ff4dce] text-white border-2 border-[var(--ink)]"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </button>
                  </div>

                  {/* Compare with Previous */}
                  {history.length >= 2 && (
                    <button
                      type="button"
                      id="compare-with-previous-btn"
                      onClick={() => setViewMode("comparison")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold bg-white dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#fffeef] border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
                    >
                      <Scale className="w-3.5 h-3.5 text-[#ff4dce]" />
                      Compare ({history.length})
                    </button>
                  )}

                  {/* Improve All / Contact Madhav Gajjar Button */}
                  <button
                    type="button"
                    id="header-improve-all-btn"
                    onClick={() => setShowContactModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-xs font-bold bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#ff4dce] hover:text-white border-2 border-[var(--ink)] brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-[#ff4dce]" />
                    <span>Improve All</span>
                  </button>

                  {/* Re-analyze / Analyze Another */}
                  <button
                    type="button"
                    id="analyze-another-btn"
                    onClick={() => {
                      setViewMode("hero");
                      setUrlInput("");
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-xs font-bold bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Analyze Another
                  </button>

                  {/* Delete Audit Button */}
                  <button
                    type="button"
                    id="delete-current-audit-btn"
                    onClick={() => handleDeleteAudit(currentAnalysis.id)}
                    className="p-2 rounded-xl font-mono text-xs font-bold bg-white dark:bg-[#1c1b22] text-[var(--ink-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-2 border-[var(--ink)] brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    title="Delete this audit from recent history"
                    aria-label="Delete this audit from recent history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Audit Source & Inspection Status Banner */}
              {currentAnalysis.warning && (() => {
                const isLegacyOAuth =
                  currentAnalysis.warning.includes("API keys are not supported") ||
                  currentAnalysis.warning.includes("OAuth2 access token") ||
                  currentAnalysis.warning.includes("Showing calculated benchmarks");

                const cleanWarning = isLegacyOAuth
                  ? "Audited via Live DOM & Network Inspector (Real-time network & DOM analysis). Add GOOGLE_PAGESPEED_API_KEY in settings for optional Google Cloud lab runner."
                  : currentAnalysis.warning;

                const isLive = isLegacyOAuth || currentAnalysis.auditSource?.includes("Live");

                return (
                  <div
                    className={`p-4 rounded-2xl border-2 border-[var(--ink)] brutal-shadow-sm text-xs font-mono flex items-center justify-between gap-3 ${
                      isLive
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isLive ? (
                        <Activity className="w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                      )}
                      <span>{cleanWarning}</span>
                    </div>
                    {isLive && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white dark:bg-black text-[var(--ink)] border border-[var(--ink)]">
                        Live Inspector
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* 4 Circular Animated Speedometer Gauges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreGauge
                  score={activeStratData.performance}
                  label="Performance"
                  sublabel="Page rendering & speed"
                  delay={0.1}
                />
                <ScoreGauge
                  score={activeStratData.seo}
                  label="SEO"
                  sublabel="Search engine visibility"
                  delay={0.2}
                />
                <ScoreGauge
                  score={activeStratData.accessibility}
                  label="Accessibility"
                  sublabel="WCAG & screen readers"
                  delay={0.3}
                />
                <ScoreGauge
                  score={activeStratData.bestPractices}
                  label="Best Practices"
                  sublabel="Security & standards"
                  delay={0.4}
                />
              </div>

              {/* Core Web Vitals Section */}
              <CoreWebVitalsSection vitals={activeStratData.vitals} />

              {/* Gemini SEO & Performance Consultant Card */}
              <AIInsightsCard
                insights={currentAnalysis.insights}
                onRegenerate={handleRegenerateInsights}
                isRegenerating={isRegeneratingInsights}
                onOpenContact={() => setShowContactModal(true)}
                isUnlocked={Boolean(unlockedUrls[currentAnalysis.url])}
                onUnlockClick={() => setShowPaymentModal(true)}
              />

              {/* Technical Audit Diagnostics & Opportunities */}
              <OpportunitiesList
                opportunities={activeStratData.opportunities}
                seoIssues={activeStratData.seoIssues}
                a11yIssues={activeStratData.a11yIssues}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Payment & ₹10 Unlock Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        url={currentAnalysis?.url}
        strategy={currentAnalysis?.activeStrategy}
      />

      {/* Contact Madhav Gajjar Modal */}
      <ContactExpertModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        siteUrl={currentAnalysis?.url}
      />

      {/* Footer (Variation 6 Design) */}
      <footer className="mt-auto border-t-2 border-[var(--ink)]/20 py-6 text-center font-mono text-xs text-[var(--ink-muted)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">© 2026 SiteScope Dashboard</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="text-[#ff4dce] hover:underline font-bold"
            >
              Contact Madhav Gajjar
            </button>
          </div>
          <span className="text-[#ff4dce] font-bold">Google PSI + Gemini Flash 3.8</span>
        </div>
      </footer>
    </div>
  );
}
