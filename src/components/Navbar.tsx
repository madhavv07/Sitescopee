import { useState } from "react";
import {
  Activity,
  Sun,
  Moon,
  History,
  Scale,
  Sparkles,
  ChevronDown,
  Trash2,
  X,
  User,
  LogOut,
} from "lucide-react";
import { AnalysisResult } from "../types";
import { UserProfile } from "./AuthModal";

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  history: AnalysisResult[];
  activeAnalysis: AnalysisResult | null;
  onSelectFromHistory: (analysis: AnalysisResult) => void;
  onDeleteAudit?: (id: string) => void;
  onClearAllHistory?: () => void;
  onOpenComparison: () => void;
  onNewAnalysis: () => void;
  onOpenContact?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  unlockedCount?: number;
}

export function Navbar({
  darkMode,
  onToggleDarkMode,
  history,
  activeAnalysis,
  onSelectFromHistory,
  onDeleteAudit,
  onClearAllHistory,
  onOpenComparison,
  onNewAnalysis,
  onOpenContact,
  currentUser,
  onOpenAuth,
  onSignOut,
  unlockedCount = 0,
}: NavbarProps) {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[var(--ink)] bg-[#fffeef]/90 dark:bg-[#1c1b22]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNewAnalysis}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <span className="font-gaegu text-2xl sm:text-3xl font-bold bg-[#2a2a2a] text-[#fffeef] dark:bg-[#f5f5f0] dark:text-[#1c1b22] px-3.5 py-0.5 -rotate-2 border-2 border-[var(--ink)] brutal-shadow-sm group-hover:rotate-0 transition-transform">
              SiteScope
            </span>
            <div className="hidden sm:flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-[#ff4dce]">
                Analysis Tool v2.0
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-mono">
                Speed & SEO Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* Center / Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {/* History Pill Selector */}
          {history.length > 0 && (
            <div className="relative">
              <button
                type="button"
                id="history-menu-btn"
                onClick={() => {
                  setShowHistoryDropdown(!showHistoryDropdown);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-[#292830] hover:bg-[#fff9ea] dark:hover:bg-[#34333d] text-[var(--ink)] border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
              >
                <History className="w-3.5 h-3.5 text-[#ff4dce]" />
                <span className="hidden sm:inline">Recent Audits</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ff4dce] text-white font-bold">
                  {history.length}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showHistoryDropdown && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 p-2 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] border-b border-[var(--ink)]/15 pb-1 flex items-center justify-between">
                    <span>Recent Audits ({history.length})</span>
                    {onClearAllHistory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearAllHistory();
                          setShowHistoryDropdown(false);
                        }}
                        className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1"
                        title="Clear all stored audits"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 mt-1.5 max-h-64 overflow-y-auto">
                    {history.map((item) => {
                      const isActive = activeAnalysis?.id === item.id;
                      const score =
                        item.activeStrategy === "desktop"
                          ? item.desktop.performance
                          : item.mobile.performance;

                      return (
                        <div
                          key={item.id}
                          className={`group/item w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                            isActive
                              ? "bg-[#ff4dce]/15 text-[var(--ink)] font-bold border border-[#ff4dce]"
                              : "hover:bg-slate-100 dark:hover:bg-[#34333d] text-[var(--ink)]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectFromHistory(item);
                              setShowHistoryDropdown(false);
                            }}
                            className="min-w-0 pr-2 text-left flex-1"
                          >
                            <p className="truncate font-semibold text-xs">{item.domain}</p>
                            <p className="font-mono text-[10px] opacity-70 capitalize">
                              {item.activeStrategy} view • {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </button>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                                score >= 90
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-400"
                                  : score >= 50
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-400"
                                  : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-400"
                              }`}
                            >
                              {score}
                            </span>

                            {onDeleteAudit && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAudit(item.id);
                                }}
                                className="p-1 rounded-md text-[var(--ink-muted)] hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                                title={`Delete audit for ${item.domain}`}
                                aria-label={`Delete audit for ${item.domain}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {history.length >= 2 && (
                    <div className="mt-2 pt-2 border-t border-[var(--ink)]/15">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenComparison();
                          setShowHistoryDropdown(false);
                        }}
                        className="w-full py-1.5 px-3 rounded-xl text-xs font-mono font-bold text-center text-[#ff4dce] hover:bg-[#ff4dce]/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Compare All ({history.length} sites)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Compare Button if 2+ sites */}
          {history.length >= 2 && (
            <button
              type="button"
              id="navbar-compare-btn"
              onClick={onOpenComparison}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[var(--ink)] bg-white dark:bg-[#292830] hover:bg-[#fff9ea] dark:hover:bg-[#34333d] border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
            >
              <Scale className="w-3.5 h-3.5 text-[#ff4dce]" />
              Compare
            </button>
          )}

          {/* New Scan Button */}
          {activeAnalysis && (
            <button
              type="button"
              id="navbar-new-scan-btn"
              onClick={onNewAnalysis}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl font-gaegu text-base sm:text-lg font-bold bg-[#ff4dce] hover:bg-[#ff33c4] text-white border-2 border-[var(--ink)] brutal-shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Audit</span>
            </button>
          )}

          {/* Contact Madhav Expert Button */}
          {onOpenContact && (
            <button
              type="button"
              id="navbar-contact-expert-btn"
              onClick={onOpenContact}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-[#ff4dce] hover:text-white border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
              title="Contact Madhav Gajjar for optimization"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-[var(--ink)]" />
              <span>Contact Madhav</span>
            </button>
          )}

          {/* User Account / Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white dark:bg-[#292830] text-[var(--ink)] border-2 border-[var(--ink)] brutal-shadow-sm hover:bg-[#fff9ea] transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-[#ff4dce] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">{currentUser.email}</span>
                {unlockedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                    {unlockedCount} 🔓
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-white dark:bg-[#292830] border-2 border-[var(--ink)] brutal-shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                  <div className="border-b border-[var(--ink)]/15 pb-2">
                    <div className="font-mono text-xs font-bold text-[var(--ink)] truncate">
                      {currentUser.displayName || "SiteScope User"}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--ink-muted)] truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-400">
                      {unlockedCount} Paid {unlockedCount === 1 ? "Audit" : "Audits"} Unlocked
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSignOut?.();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl font-mono text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                id="navbar-signin-btn"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#ff4dce] hover:text-white border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
              >
                <User className="w-3.5 h-3.5 text-[#ff4dce]" />
                <span>Sign In</span>
              </button>
            )
          )}

          {/* Dark / Light Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-[var(--ink)] bg-white dark:bg-[#292830] hover:bg-[#fff9ea] dark:hover:bg-[#34333d] border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
            aria-label="Toggle color theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#ff4dce]" />}
          </button>
        </div>
      </div>
    </header>
  );
}
