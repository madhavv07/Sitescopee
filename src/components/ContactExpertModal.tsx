import { useState } from "react";
import { Mail, Linkedin, ExternalLink, Check, Copy, Sparkles, X, MessageSquare, ArrowUpRight } from "lucide-react";

interface ContactExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl?: string;
}

export function ContactExpertModal({ isOpen, onClose, siteUrl }: ContactExpertModalProps) {
  const [copied, setCopied] = useState(false);
  const email = "madhavgajjar7@gmail.com";
  const linkedinUrl = "https://www.linkedin.com/in/madhav-gajjar-0b9629265?utm_source=share_via&utm_content=profile&utm_medium=member_android";

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoSubject = encodeURIComponent(
    siteUrl ? `Website Optimization & Performance Inquiry: ${siteUrl}` : "Website Optimization & SEO Consulting Inquiry"
  );
  const mailtoBody = encodeURIComponent(
    siteUrl
      ? `Hi Madhav,\n\nI just analyzed ${siteUrl} on SiteScope and would like your expert help to improve my website's Core Web Vitals, speed, and SEO ranking.\n\nLet's connect!\n`
      : `Hi Madhav,\n\nI would like your help to optimize my website's performance and SEO.\n\nLet's connect!\n`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#222129] text-[var(--ink)] border-3 border-[var(--ink)] rounded-3xl brutal-shadow-lg p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl border-2 border-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-[#ff4dce] hover:text-white transition-colors brutal-shadow-sm"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header sticker & Title */}
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold bg-[#ff4dce] text-white px-3 py-0.5 rounded-md border-2 border-[var(--ink)] brutal-shadow-sm -rotate-2">
            <Sparkles className="w-3.5 h-3.5" />
            Website Optimization Specialist
          </div>
          <h3 className="font-gaegu text-3xl sm:text-4xl font-bold text-[var(--ink)] leading-none">
            Let's improve this website together!
          </h3>
          <p className="font-mono text-xs text-[var(--ink-muted)] leading-relaxed">
            Need help fixing these diagnostics, boosting Core Web Vitals, or executing the Gemini action plan? Connect directly with Madhav Gajjar.
          </p>
        </div>

        {/* Profile Card */}
        <div className="p-4 rounded-2xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] brutal-shadow-sm flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-2xl bg-[var(--ink)] text-[var(--bg)] border-2 border-[var(--ink)] flex items-center justify-center font-gaegu text-2xl font-bold flex-shrink-0 -rotate-2">
            MG
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-gaegu text-2xl font-bold text-[var(--ink)] leading-tight">
                Madhav Gajjar
              </h4>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-[var(--ink)]">
                Available
              </span>
            </div>
            <p className="font-mono text-xs text-[var(--ink-muted)] truncate">
              Web Performance & SEO Specialist
            </p>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="space-y-3">
          {/* LinkedIn Button */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-[var(--ink)] bg-[#0077b5] text-white brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-mono text-xs font-bold"
          >
            <div className="flex items-center gap-2.5">
              <Linkedin className="w-5 h-5 fill-current" />
              <span>Connect on LinkedIn</span>
            </div>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Email Direct Link */}
          <a
            href={`mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-[var(--ink)] bg-[#ff4dce] text-white brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-mono text-xs font-bold"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5" />
              <span>Send Email Directly</span>
            </div>
            <ArrowUpRight className="w-4 h-4" />
          </a>

          {/* Copy Email Box */}
          <div className="flex items-center justify-between p-3 rounded-xl border-2 border-[var(--ink)] bg-white dark:bg-[#292830]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-[var(--ink-muted)]">Email:</span>
              <span className="font-mono text-xs font-bold truncate text-[var(--ink)]">
                {email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] font-mono text-xs font-bold hover:bg-[#ff4dce] hover:text-white transition-colors flex-shrink-0 ml-2"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-1 text-center">
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">
            ⚡ Quick turnaround on Lighthouse score fixes, CWV optimization & SEO audits.
          </p>
        </div>
      </div>
    </div>
  );
}
