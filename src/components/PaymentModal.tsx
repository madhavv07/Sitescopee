import { useState } from "react";
import {
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Code2,
  FileText,
  Zap,
  ShieldCheck,
  QrCode,
  CreditCard,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Strategy } from "../types";
import { UserProfile } from "./AuthModal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (unlockToken: string) => void;
  url?: string;
  strategy?: Strategy;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  url = "",
  strategy = "mobile",
  currentUser,
  onOpenAuth,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dodo" | "upi_qr" | "razorpay">("dodo");

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // DODO PAYMENTS CHECKOUT HANDLER
  // --------------------------------------------------------------------------
  const handleDodoPay = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy, email: currentUser?.email }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initialize Dodo checkout.");
      }

      const orderData = await res.json();

      // If live/test Dodo checkout URL exists, redirect customer
      if (orderData.checkoutUrl) {
        window.location.href = orderData.checkoutUrl;
        return;
      }

      // If in Simulator Mode (no API keys in .env yet), auto verify
      if (orderData.isMock || !orderData.checkoutUrl) {
        const verifyRes = await fetch("/api/dodo/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: orderData.sessionId || `dodo_sim_${Date.now()}`,
            isMock: true,
            url,
            email: currentUser?.email,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          onSuccess(verifyData.unlockToken || "unlocked_token");
          onClose();
        } else {
          setErrorMessage(verifyData.error || "Could not complete simulated payment.");
        }
      }
    } catch (err: any) {
      console.error("Dodo payment error:", err);
      setErrorMessage(err.message || "Failed to launch Dodo Payments checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // DIRECT SIMULATION HANDLER
  // --------------------------------------------------------------------------
  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setErrorMessage(null);

    try {
      await new Promise((r) => setTimeout(r, 800));

      const verifyRes = await fetch("/api/dodo/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: `dodo_sim_${Date.now()}`,
          isMock: true,
          url,
          email: currentUser?.email,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.success) {
        onSuccess(verifyData.unlockToken || "unlocked_token");
        onClose();
      } else {
        setErrorMessage("Simulator payment could not be processed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error simulating payment.");
    } finally {
      setIsSimulating(false);
    }
  };

  // --------------------------------------------------------------------------
  // RAZORPAY HANDLER (OPTIONAL / LEGACY)
  // --------------------------------------------------------------------------
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPay = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initialize payment order.");
      }

      const orderData = await res.json();

      if (orderData.isMock || !orderData.keyId) {
        handleSimulatePayment();
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay payment gateway SDK.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "SiteScope SEO Intelligence",
        description: `Full Audit & Code Fixes for ${url || "website"}`,
        order_id: orderData.orderId,
        theme: { color: "#ff4dce" },
        handler: async (response: any) => {
          try {
            setIsLoading(true);
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              onSuccess(verifyData.unlockToken || "unlocked");
              onClose();
            } else {
              setErrorMessage(verifyData.error || "Payment verification failed.");
            }
          } catch (vErr: any) {
            setErrorMessage(vErr.message || "Error verifying payment signature.");
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setErrorMessage(response.error?.description || "Payment failed or was cancelled.");
        setIsLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      setErrorMessage(err.message || "Something went wrong initiating checkout.");
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#222129] rounded-3xl border-3 border-[var(--ink)] brutal-shadow-lg p-6 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-[var(--ink)] bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-rose-100 hover:text-rose-600 border-2 border-[var(--ink)] brutal-shadow-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-[#ff4dce] text-white border-2 border-[var(--ink)] brutal-shadow-sm -rotate-3 flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[var(--ink)] leading-none">
                Unlock Full AI Audit & Fixes
              </h2>
            </div>
            <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
              One-time micro-payment of <strong className="text-[#ff4dce] font-bold">₹10 INR</strong> to unlock line-by-line developer fixes & insertion guides for <span className="underline font-bold text-[var(--ink)]">{url || "this website"}</span>.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] flex items-start gap-2.5">
            <Code2 className="w-4 h-4 text-[#ff4dce] mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <div className="font-mono text-xs font-bold text-[var(--ink)]">Copy-Paste Code Fixes</div>
              <div className="text-[11px] text-[var(--ink-muted)] leading-tight">Ready HTML, CSS & server config snippets tailored to your site.</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#ff4dce] mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <div className="font-mono text-xs font-bold text-[var(--ink)]">Exact Target & Insertion</div>
              <div className="text-[11px] text-[var(--ink-muted)] leading-tight">Shows exact file names and where to insert each snippet.</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-[#ff4dce] mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <div className="font-mono text-xs font-bold text-[var(--ink)]">Google SEO Factor</div>
              <div className="text-[11px] text-[var(--ink-muted)] leading-tight">Explains ranking algorithm impact & organic CTR improvements.</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#ff4dce] mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <div className="font-mono text-xs font-bold text-[var(--ink)]">Instant Delivery</div>
              <div className="text-[11px] text-[var(--ink-muted)] leading-tight">Unlocks immediately with zero subscriptions or recurring charges.</div>
            </div>
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="p-4 rounded-2xl bg-[#fffeef] dark:bg-[#1c1b22] border-3 border-[var(--ink)] brutal-shadow flex items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-[var(--ink-muted)]">
              Single Report Pass
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-gaegu text-4xl font-bold text-[var(--ink)]">₹10</span>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                (Launch pricing • regular ₹99)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-[var(--ink)]">
              <Zap className="w-3 h-3 text-emerald-600" /> Instant Unlock
            </span>
          </div>
        </div>

        {/* Account Status / Persistence Notice */}
        {currentUser ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 font-mono text-xs flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Unlocking for <strong className="underline">{currentUser.email}</strong> (saved permanently to your account)</span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 font-mono text-xs flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Want this audit saved permanently across devices?</span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold hover:bg-amber-300 transition-colors whitespace-nowrap cursor-pointer"
              >
                Sign In First
              </button>
            )}
          </div>
        )}

        {/* Payment Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b-2 border-[var(--ink)]/20 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("dodo")}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[var(--ink)] transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "dodo"
                ? "bg-[#ff4dce] text-white brutal-shadow-sm"
                : "bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#fff7d9]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Dodo Payments (UPI + Cards)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upi_qr")}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[var(--ink)] transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "upi_qr"
                ? "bg-[#ff4dce] text-white brutal-shadow-sm"
                : "bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#fff7d9]"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Direct UPI QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("razorpay")}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[var(--ink)] transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "razorpay"
                ? "bg-[#ff4dce] text-white brutal-shadow-sm"
                : "bg-[#fffeef] dark:bg-[#1c1b22] text-[var(--ink)] hover:bg-[#fff7d9]"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Razorpay
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-600 text-rose-700 dark:text-rose-300 font-mono text-xs text-left">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: DODO PAYMENTS (UPI + CARDS) */}
        {activeTab === "dodo" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1b22] border-2 border-[var(--ink)] text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Dodo Payments Gateway
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ff4dce]/15 text-[#ff4dce] font-bold border border-[#ff4dce]/30">
                  Merchant of Record
                </span>
              </div>

              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Pay seamlessly with any <strong>Indian UPI app</strong> (Google Pay, PhonePe, Paytm, BHIM) or <strong>Domestic/International Cards</strong>. Automatic GST invoicing included.
              </p>

              {/* Supported Payment Badges */}
              <div className="space-y-1.5 pt-1">
                <div className="font-mono text-[11px] font-bold text-[var(--ink-muted)]">Supported payment methods:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 rounded-md bg-[#e8f0fe] text-[#1967d2] font-mono text-[11px] font-bold border border-[#1967d2]/30">
                    Google Pay
                  </span>
                  <span className="px-2 py-1 rounded-md bg-[#5f259f]/10 text-[#5f259f] font-mono text-[11px] font-bold border border-[#5f259f]/30">
                    PhonePe
                  </span>
                  <span className="px-2 py-1 rounded-md bg-[#00b9f5]/10 text-[#002e6e] font-mono text-[11px] font-bold border border-[#00b9f5]/30">
                    Paytm UPI
                  </span>
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-300">
                    Visa / Mastercard
                  </span>
                  <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-800 font-mono text-[11px] font-bold border border-purple-300">
                    RuPay
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Checkout Button */}
            <button
              type="button"
              id="launch-dodo-checkout-btn"
              onClick={handleDodoPay}
              disabled={isLoading || isSimulating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#ff4dce] hover:bg-[#e038b3] text-white font-gaegu text-2xl font-bold border-3 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-5 h-5" />
              <span>{isLoading ? "Connecting to Dodo..." : "Pay ₹10 via Dodo Payments"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Instant Dev / Simulator Mode */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                id="simulate-dodo-btn"
                onClick={handleSimulatePayment}
                disabled={isSimulating || isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#fffeef] dark:bg-[#1c1b22] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold border-2 border-[var(--ink)] brutal-shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isSimulating ? "Simulating ₹10 unlock..." : "Instant Test Simulator (1-Click Free Unlock)"}</span>
              </button>
              <p className="font-mono text-[10px] text-center text-[var(--ink-muted)]">
                💡 Simulator mode allows testing the complete unlock immediately without test cards or live funds.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: DIRECT UPI QR */}
        {activeTab === "upi_qr" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white dark:bg-[#1c1b22] border-2 border-[var(--ink)]">
              {/* Dynamic SVG UPI QR Code */}
              <div className="p-3 rounded-2xl bg-white border-2 border-[var(--ink)] brutal-shadow-sm flex flex-col items-center justify-center flex-shrink-0">
                <svg
                  className="w-32 h-32 text-[var(--ink)]"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="5" y="5" width="28" height="28" fill="currentColor" rx="4" />
                  <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="13" width="12" height="12" fill="currentColor" rx="2" />

                  <rect x="67" y="5" width="28" height="28" fill="currentColor" rx="4" />
                  <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="75" y="13" width="12" height="12" fill="currentColor" rx="2" />

                  <rect x="5" y="67" width="28" height="28" fill="currentColor" rx="4" />
                  <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="75" width="12" height="12" fill="currentColor" rx="2" />

                  <rect x="38" y="10" width="8" height="8" rx="2" />
                  <rect x="50" y="10" width="8" height="8" rx="2" />
                  <rect x="38" y="24" width="8" height="8" rx="2" />
                  <rect x="50" y="24" width="8" height="8" rx="2" />

                  <rect x="10" y="38" width="8" height="8" rx="2" />
                  <rect x="24" y="38" width="8" height="8" rx="2" />
                  <rect x="38" y="38" width="8" height="8" rx="2" />
                  <rect x="50" y="38" width="8" height="8" rx="2" />
                  <rect x="64" y="38" width="8" height="8" rx="2" />
                  <rect x="78" y="38" width="8" height="8" rx="2" />

                  <rect x="10" y="50" width="8" height="8" rx="2" />
                  <rect x="24" y="50" width="8" height="8" rx="2" />
                  <rect x="38" y="50" width="8" height="8" rx="2" />
                  <rect x="64" y="50" width="8" height="8" rx="2" />
                  <rect x="78" y="50" width="8" height="8" rx="2" />

                  <rect x="38" y="64" width="8" height="8" rx="2" />
                  <rect x="50" y="64" width="8" height="8" rx="2" />
                  <rect x="64" y="64" width="8" height="8" rx="2" />
                  <rect x="78" y="64" width="8" height="8" rx="2" />

                  <rect x="38" y="78" width="8" height="8" rx="2" />
                  <rect x="50" y="78" width="8" height="8" rx="2" />
                  <rect x="64" y="78" width="8" height="8" rx="2" />
                  <rect x="78" y="78" width="8" height="8" rx="2" />
                </svg>
                <span className="font-mono text-[10px] font-bold mt-1 text-[var(--ink-muted)]">
                  Scan to Pay ₹10
                </span>
              </div>

              {/* UPI App Badges & Instructions */}
              <div className="space-y-2 text-left flex-1">
                <div className="font-mono text-xs font-bold text-[var(--ink)]">
                  Pay via any UPI Application:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 rounded-md bg-[#e8f0fe] text-[#1967d2] font-mono text-[11px] font-bold border border-[#1967d2]/30">
                    Google Pay
                  </span>
                  <span className="px-2 py-1 rounded-md bg-[#5f259f]/10 text-[#5f259f] font-mono text-[11px] font-bold border border-[#5f259f]/30">
                    PhonePe
                  </span>
                  <span className="px-2 py-1 rounded-md bg-[#00b9f5]/10 text-[#002e6e] font-mono text-[11px] font-bold border border-[#00b9f5]/30">
                    Paytm
                  </span>
                  <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-800 font-mono text-[11px] font-bold border border-orange-300">
                    BHIM
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[var(--ink-muted)] pt-1">
                  UPI ID: <span className="font-bold text-[var(--ink)] select-all">sitescope@upi</span>
                </div>
              </div>
            </div>

            {/* Test Simulation Button */}
            <button
              type="button"
              id="simulate-upi-btn"
              onClick={handleSimulatePayment}
              disabled={isSimulating || isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-gaegu text-2xl font-bold border-3 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSimulating ? "Approving ₹10 Payment..." : "Test Pay ₹10 (Instant Approve Simulator)"}</span>
            </button>
          </div>
        )}

        {/* Tab 3: RAZORPAY GATEWAY */}
        {activeTab === "razorpay" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#fffeef] dark:bg-[#1c1b22] border-2 border-[var(--ink)] text-left space-y-2">
              <div className="font-mono text-xs font-bold text-[var(--ink)]">
                Razorpay Checkout (Legacy)
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Use Razorpay if you already have active Razorpay merchant API keys configured in <code className="font-bold">.env</code>.
              </p>
              <div className="font-mono text-[11px] text-[var(--ink-muted)] flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                RBI Compliant • 128-bit SSL
              </div>
            </div>

            <button
              type="button"
              id="launch-razorpay-btn"
              onClick={handleRazorpayPay}
              disabled={isLoading || isSimulating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#ff4dce] hover:bg-[#e038b3] text-white font-gaegu text-2xl font-bold border-3 border-[var(--ink)] brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-5 h-5" />
              <span>{isLoading ? "Connecting to Gateway..." : "Launch Razorpay (Pay ₹10)"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

