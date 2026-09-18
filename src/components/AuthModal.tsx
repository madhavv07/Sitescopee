import { useState, useEffect } from "react";
import { X, Mail, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { loginWithGoogle } from "../lib/firebase";

export interface UserProfile {
  email: string;
  displayName?: string;
  uid: string;
  provider: "google" | "otp";
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialEmail?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialEmail = "",
}: AuthModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  // Handle Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogle();
      if (res && res.user && res.user.email) {
        const profile: UserProfile = {
          email: res.user.email.toLowerCase(),
          displayName: res.user.displayName || res.user.email.split("@")[0],
          uid: res.user.uid,
          provider: "google",
        };
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.warn("Google sign-in error:", err);
      if (!err.message?.includes("closed-by-user") && !err.message?.includes("popup-closed")) {
        setErrorMessage(err.message || "Google sign-in was cancelled or failed.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Requesting Email OTP via Resend
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send login code.");
      }

      setStep("otp");
      setCountdown(60);
      setSuccessMessage(data.message || "Verification code sent to your inbox.");
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setErrorMessage("Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: cleanOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code.");
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed. Please check the code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#222129] rounded-3xl border-3 border-[var(--ink)] brutal-shadow-lg p-6 sm:p-7 space-y-6 text-left">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-rose-100 hover:text-rose-600 border-2 border-[var(--ink)] brutal-shadow-sm transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm -rotate-3 flex-shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-gaegu text-3xl font-bold text-[var(--ink)] leading-none">
              {step === "email" ? "Welcome to SiteScope" : "Check Your Inbox"}
            </h2>
            <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
              {step === "email"
                ? "Sign in to keep your unlocked audits and code fixes permanently saved across all devices."
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-600 text-rose-700 dark:text-rose-300 font-mono text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && step === "otp" && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Email Form + Google Auth */}
        {step === "email" && (
          <div className="space-y-4">
            {/* Google 1-Click Sign-In */}
            <button
              type="button"
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-[#1c1b22] hover:bg-[#fffeef] dark:hover:bg-[#2a2933] text-[var(--ink)] font-mono text-xs font-bold border-2 border-[var(--ink)] brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>

            <div className="relative flex items-center justify-center py-1">
              <div className="border-t-2 border-[var(--ink)]/15 w-full"></div>
              <span className="bg-white dark:bg-[#222129] px-3 font-mono text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider absolute">
                or with email code
              </span>
            </div>

            {/* Email OTP Form */}
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block font-mono text-xs font-bold text-[var(--ink)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="auth-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border-2 border-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] px-4 py-3 rounded-xl font-mono text-xs focus:outline-none brutal-shadow-sm"
                  />
                  <Mail className="w-4 h-4 text-[var(--ink-muted)] absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                id="send-otp-btn"
                disabled={isLoading || isGoogleLoading || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#ff4dce] hover:bg-[#e038b3] text-white font-gaegu text-2xl font-bold border-3 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Sending Code..." : "Send 6-Digit Code"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: 6-Digit OTP Form */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-xs font-bold text-[var(--ink)]">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="font-mono text-[11px] text-[#ff4dce] hover:underline font-bold cursor-pointer"
                >
                  Edit email
                </button>
              </div>

              <input
                type="text"
                id="auth-otp-input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                autoFocus
                className="w-full border-3 border-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] text-center tracking-[12px] font-mono text-2xl font-bold py-3 rounded-2xl focus:outline-none brutal-shadow"
              />
            </div>

            {/* Quick autofill pill for testing */}
            {devOtp && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 font-mono text-[11px]">
                <span className="text-amber-800 dark:text-amber-300 font-bold">
                  💡 Test Code: <span className="underline">{devOtp}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold hover:bg-amber-300 cursor-pointer"
                >
                  Paste
                </button>
              </div>
            )}

            <button
              type="submit"
              id="verify-otp-btn"
              disabled={isLoading || otp.trim().length < 6}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-gaegu text-2xl font-bold border-3 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isLoading ? "Verifying..." : "Verify & Log In"}</span>
            </button>

            <div className="text-center pt-1">
              {countdown > 0 ? (
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  Resend code in <strong className="text-[var(--ink)]">{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  className="font-mono text-[11px] text-[#ff4dce] hover:underline font-bold cursor-pointer"
                >
                  Didn&apos;t receive code? Resend
                </button>
              )}
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-[var(--ink)]/10 text-center">
          <p className="font-mono text-[10px] text-[var(--ink-muted)]">
            By signing in, your unlocked reports and actionable code fixes are permanently attached to your account.
          </p>
        </div>
      </div>
    </div>
  );
}