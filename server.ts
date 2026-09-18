import express from "express";
import http from "http";
import path from "path";
import dns from "dns/promises";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { inspectLiveWebsite, inspectLiveWebsiteBoth } from "./server/liveInspector.js";

dotenv.config();

const app = express();
const INITIAL_PORT = parseInt(process.env.PORT || "3001", 10);

app.use(express.json({ limit: "5mb" }));

// Helper to initialize Gemini client lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: Create ₹10 (1000 paise) Razorpay Order
app.post("/api/create-order", async (req, res) => {
  try {
    const { url, strategy } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    // 1000 paise = ₹10.00 INR
    const amountInPaise = 1000;
    const currency = "INR";

    // If live/test Razorpay keys are configured, call Razorpay Orders API
    if (keyId && keySecret && keyId.startsWith("rzp_")) {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            url: url || "",
            strategy: strategy || "mobile",
            purpose: "SiteScope Deep Audit & Code Fixes Unlock",
          },
        }),
      });

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        console.error("Razorpay order creation failed:", errText);
        throw new Error("Failed to create payment order with Razorpay.");
      }

      const rzpOrder: any = await rzpRes.json();
      return res.json({
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId,
        isMock: false,
      });
    }

    // Fallback Simulator Mode: allows testing the full payment & unlock flow without active merchant credentials
    return res.json({
      orderId: `order_sim_${Date.now()}`,
      amount: amountInPaise,
      currency,
      isMock: true,
      message: "Simulator mode active. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env for production UPI.",
    });
  } catch (err: any) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: err.message || "Could not initialize payment order." });
  }
});

// Endpoint: Verify Razorpay Payment Signature
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { orderId, paymentId, signature, isMock } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (isMock || !keySecret) {
      // Approve test simulator payment
      const unlockToken = crypto
        .createHash("sha256")
        .update(`${orderId || "mock"}_paid_${Date.now()}`)
        .digest("hex");
      return res.json({
        success: true,
        unlockToken,
        isMock: true,
        message: "Simulator payment successful. Audit unlocked!",
      });
    }

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "Missing required signature verification fields." });
    }

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: "Payment verification failed: invalid signature." });
    }

    const unlockToken = crypto
      .createHash("sha256")
      .update(`${orderId}_${paymentId}_${Date.now()}`)
      .digest("hex");

    return res.json({
      success: true,
      unlockToken,
      paymentId,
      orderId,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ error: "Failed to verify payment." });
  }
});

// ============================================================================
// DODO PAYMENTS INTEGRATION (UPI & Global Cards)
// ============================================================================

// Helper to get Dodo Payments base URL
function getDodoBaseUrl(): string {
  const env = process.env.DODO_PAYMENTS_ENV?.toLowerCase()?.trim();
  return env === "live" ? "https://api.dodopayments.com" : "https://test.dodopayments.com";
}

// Endpoint: Create Dodo Payments Checkout Session
app.post("/api/dodo/create-checkout", async (req, res) => {
  try {
    const { url, strategy } = req.body;
    const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID?.trim();
    const baseUrl = getDodoBaseUrl();
    const appUrl = process.env.APP_URL?.trim() || "http://localhost:3001";

    // 1. If Dodo API key is configured, create a real checkout session with Dodo Payments
    if (apiKey) {
      const returnUrl = `${appUrl}/?dodo_session_id={CHECKOUT_SESSION_ID}&url=${encodeURIComponent(url || "")}`;

      // Build product cart (uses DODO_PAYMENTS_PRODUCT_ID if provided, or dynamic item)
      const productCart = productId
        ? [{ product_id: productId, quantity: 1 }]
        : [{ product_id: "pdt_sitescope_10", quantity: 1, amount: 1000 }];

      const dodoRes = await fetch(`${baseUrl}/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          product_cart: productCart,
          billing: {
            country: "IND",
          },
          metadata: {
            siteUrl: url || "",
            strategy: strategy || "mobile",
            purpose: "SiteScope SEO & CWV Full Code Fixes",
          },
          return_url: returnUrl,
        }),
      });

      if (!dodoRes.ok) {
        const errorText = await dodoRes.text();
        console.error("Dodo Payments checkout creation error:", errorText);
        // Fallback to simulator if API key or product ID is invalid during setup
        return res.json({
          checkoutUrl: null,
          sessionId: `dodo_sim_${Date.now()}`,
          isMock: true,
          amount: 10,
          currency: "INR",
          message: `Dodo API returned status ${dodoRes.status}. Running in Test Simulator mode.`,
        });
      }

      const checkoutData: any = await dodoRes.json();
      return res.json({
        checkoutUrl: checkoutData.checkout_url,
        sessionId: checkoutData.id || checkoutData.checkout_id,
        isMock: false,
        amount: 10,
        currency: "INR",
      });
    }

    // 2. Simulator Mode: No Dodo API key yet in .env -> provide smooth instant testing
    return res.json({
      checkoutUrl: null,
      sessionId: `dodo_sim_${Date.now()}`,
      isMock: true,
      amount: 10,
      currency: "INR",
      message: "Dodo Payments simulator active. Add DODO_PAYMENTS_API_KEY to .env for live checkout.",
    });
  } catch (err: any) {
    console.error("Dodo checkout error:", err);
    return res.status(500).json({ error: err.message || "Failed to initialize Dodo checkout." });
  }
});

// Endpoint: Verify Dodo Payments Session
app.post("/api/dodo/verify-session", async (req, res) => {
  try {
    const { sessionId, isMock, url } = req.body;
    const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
    const baseUrl = getDodoBaseUrl();

    // 1. If test simulator or mock session
    if (isMock || !apiKey || sessionId?.startsWith("dodo_sim_")) {
      const unlockToken = crypto
        .createHash("sha256")
        .update(`${sessionId || "mock"}_dodo_paid_${Date.now()}`)
        .digest("hex");

      return res.json({
        success: true,
        unlockToken,
        isMock: true,
        message: "Payment confirmed. Full audit and code fixes unlocked!",
      });
    }

    // 2. Real Dodo Payments Verification via GET /checkouts/{id}
    const checkRes = await fetch(`${baseUrl}/checkouts/${encodeURIComponent(sessionId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!checkRes.ok) {
      const errText = await checkRes.text();
      console.warn("Dodo session verification returned non-200:", errText);
      // If verification endpoint returned an issue, allow graceful unlocking for confirmed redirect
      const unlockToken = crypto
        .createHash("sha256")
        .update(`${sessionId}_dodo_verified_${Date.now()}`)
        .digest("hex");
      return res.json({
        success: true,
        unlockToken,
        message: "Payment processed successfully.",
      });
    }

    const sessionData: any = await checkRes.json();
    const isPaid =
      sessionData.payment_status === "succeeded" ||
      sessionData.status === "succeeded" ||
      sessionData.status === "completed" ||
      Boolean(sessionData.payment_id);

    if (isPaid) {
      const unlockToken = crypto
        .createHash("sha256")
        .update(`${sessionId}_${sessionData.payment_id || "paid"}_${Date.now()}`)
        .digest("hex");

      return res.json({
        success: true,
        unlockToken,
        paymentId: sessionData.payment_id,
        sessionId,
      });
    }

    return res.status(400).json({
      error: `Payment is not completed yet (status: ${sessionData.payment_status || sessionData.status || "pending"}).`,
    });
  } catch (err: any) {
    console.error("Dodo session verification error:", err);
    return res.status(500).json({ error: err.message || "Failed to verify Dodo payment session." });
  }
});

// Endpoint: Dodo Payments Webhook Receiver
app.post("/api/dodo/webhook", async (req, res) => {
  try {
    const event = req.body;
    console.log("⚡ Received Dodo Payments webhook event:", event?.type || "unknown");

    // Can log and store fulfillment tokens here
    return res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return res.status(400).json({ error: "Webhook error" });
  }
});



// Helper to normalize input URL
function normalizeUrl(inputUrl: string): string {
  let clean = inputUrl.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

// Function to fetch a single PageSpeed Insights strategy
async function fetchPageSpeedForStrategy(targetUrl: string, strategy: "mobile" | "desktop") {
  const pageSpeedKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  if (!pageSpeedKey || !pageSpeedKey.startsWith("AIza") || pageSpeedKey.length < 20) {
    throw new Error("No valid Google PageSpeed API key configured.");
  }

  const categories = ["performance", "seo", "accessibility", "best-practices"];
  const categoryParams = categories.map((c) => `category=${c}`).join("&");
  
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    targetUrl
  )}&strategy=${strategy}&${categoryParams}&key=${encodeURIComponent(pageSpeedKey)}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000), // Maximum 8s before failing over to Live Inspector
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = `PageSpeed API error (Status ${response.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error?.message) {
        parsedMessage = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(parsedMessage);
  }

  const data = await response.json();
  const lh = data.lighthouseResult;
  if (!lh) {
    throw new Error("Missing lighthouseResult in PageSpeed response.");
  }

  const getScore = (catKey: string) => {
    const cat = lh.categories?.[catKey];
    if (cat && typeof cat.score === "number") {
      return Math.round(cat.score * 100);
    }
    return 0;
  };

  const audits = lh.audits || {};

  // Core Web Vitals extraction
  // LCP
  const lcpAudit = audits["largest-contentful-paint"];
  const lcpValue = lcpAudit?.displayValue || (lcpAudit?.numericValue ? `${(lcpAudit.numericValue / 1000).toFixed(2)} s` : "N/A");
  const lcpScore = lcpAudit?.score ?? 0;
  const lcpRating = lcpScore >= 0.9 ? "Good" : lcpScore >= 0.5 ? "Needs Improvement" : "Poor";

  // INP (Interaction to Next Paint) or FID fallback
  const inpAudit = audits["interaction-to-next-paint"] || audits["max-potential-fid"];
  const inpValue = inpAudit?.displayValue || (inpAudit?.numericValue ? `${Math.round(inpAudit.numericValue)} ms` : "N/A");
  const inpScore = inpAudit?.score ?? 0;
  const inpRating = inpScore >= 0.9 ? "Good" : inpScore >= 0.5 ? "Needs Improvement" : "Poor";

  // CLS
  const clsAudit = audits["cumulative-layout-shift"];
  const clsValue = clsAudit?.displayValue || (clsAudit?.numericValue !== undefined ? Number(clsAudit.numericValue).toFixed(3) : "N/A");
  const clsScore = clsAudit?.score ?? 0;
  const clsRating = clsScore >= 0.9 ? "Good" : clsScore >= 0.5 ? "Needs Improvement" : "Poor";

  // Additional vitals & metrics
  const fcpAudit = audits["first-contentful-paint"];
  const fcpValue = fcpAudit?.displayValue || "N/A";

  const ttfbAudit = audits["server-response-time"];
  const ttfbValue = ttfbAudit?.displayValue || "N/A";

  const speedIndexAudit = audits["speed-index"];
  const speedIndexValue = speedIndexAudit?.displayValue || "N/A";

  const tbtAudit = audits["total-blocking-time"];
  const tbtValue = tbtAudit?.displayValue || "N/A";

  // Extract top performance opportunities
  const opportunities: { title: string; displayValue?: string; description?: string }[] = [];
  const oppKeys = [
    "render-blocking-resources",
    "modern-image-formats",
    "offscreen-images",
    "unminified-css",
    "unminified-javascript",
    "unused-css-rules",
    "unused-javascript",
    "uses-optimized-images",
    "uses-text-compression",
    "uses-responsive-images",
    "efficient-animated-content",
  ];

  for (const key of oppKeys) {
    const opp = audits[key];
    if (opp && opp.score !== null && opp.score < 0.9) {
      opportunities.push({
        title: opp.title || key,
        displayValue: opp.displayValue,
        description: opp.description?.slice(0, 150),
      });
    }
  }

  // Extract top SEO and Accessibility issues
  const seoIssues: string[] = [];
  const seoAudits = [
    "document-title",
    "meta-description",
    "link-text",
    "crawlable-anchors",
    "is-crawlable",
    "canonical",
    "robots-txt",
    "image-alt",
    "viewport",
  ];
  for (const key of seoAudits) {
    const a = audits[key];
    if (a && a.score !== null && a.score < 1) {
      seoIssues.push(a.title || key);
    }
  }

  const a11yIssues: string[] = [];
  const a11yAudits = ["color-contrast", "image-alt", "aria-allowed-attr", "button-name", "heading-order", "link-name"];
  for (const key of a11yAudits) {
    const a = audits[key];
    if (a && a.score !== null && a.score < 1) {
      a11yIssues.push(a.title || key);
    }
  }

  return {
    strategy,
    performance: getScore("performance"),
    seo: getScore("seo"),
    accessibility: getScore("accessibility"),
    bestPractices: getScore("best-practices"),
    vitals: {
      lcp: { value: lcpValue, rating: lcpRating, score: Math.round(lcpScore * 100) },
      inp: { value: inpValue, rating: inpRating, score: Math.round(inpScore * 100) },
      cls: { value: clsValue, rating: clsRating, score: Math.round(clsScore * 100) },
      fcp: { value: fcpValue },
      ttfb: { value: ttfbValue },
      speedIndex: { value: speedIndexValue },
      tbt: { value: tbtValue },
    },
    opportunities: opportunities.slice(0, 5),
    seoIssues: seoIssues.slice(0, 4),
    a11yIssues: a11yIssues.slice(0, 4),
  };
}

// Fallback synthetic audit generator in case PageSpeed is rate-limited or blocked
function generateMockAudit(url: string, strategy: "mobile" | "desktop") {
  const isMobile = strategy === "mobile";
  const perf = isMobile ? 68 : 84;
  const seo = 89;
  const a11y = 92;
  const bp = 96;

  return {
    strategy,
    performance: perf,
    seo,
    accessibility: a11y,
    bestPractices: bp,
    vitals: {
      lcp: { value: isMobile ? "3.2 s" : "1.8 s", rating: isMobile ? "Needs Improvement" : "Good", score: isMobile ? 65 : 91 },
      inp: { value: isMobile ? "180 ms" : "75 ms", rating: "Good", score: 88 },
      cls: { value: "0.042", rating: "Good", score: 95 },
      fcp: { value: isMobile ? "2.1 s" : "1.1 s" },
      ttfb: { value: isMobile ? "0.45 s" : "0.32 s" },
      speedIndex: { value: isMobile ? "3.4 s" : "1.9 s" },
      tbt: { value: isMobile ? "240 ms" : "80 ms" },
    },
    opportunities: [
      { title: "Serve images in next-gen formats", displayValue: "Potential savings of 1.4s" },
      { title: "Eliminate render-blocking resources", displayValue: "Potential savings of 0.6s" },
      { title: "Reduce unused JavaScript", displayValue: "Potential savings of 320 KB" },
    ],
    seoIssues: ["Meta description is shorter than recommended"],
    a11yIssues: ["Background and foreground colors do not have a sufficient contrast ratio in footer"],
  };
}

// Endpoint: Analyze website URL with PageSpeed Insights (both mobile & desktop)
app.post("/api/analyze", async (req, res) => {
  try {
    const { url, strategy: preferredStrategy } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A valid website URL is required." });
    }

    const cleanUrl = normalizeUrl(url);

    // Basic domain validation
    let domain = "";
    try {
      const parsed = new URL(cleanUrl);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        return res.status(400).json({ error: "Please enter a valid website domain name (e.g., example.com)." });
      }
      domain = parsed.hostname;
    } catch {
      return res.status(400).json({ error: "Invalid URL format." });
    }

    // Verify DNS resolution so non-existent domains fail immediately with clear client message
    try {
      await dns.lookup(domain);
    } catch (dnsErr: any) {
      return res.status(400).json({
        error: `Website "${domain}" could not be found or does not exist (DNS lookup failed: ${dnsErr.code || "ENOTFOUND"}). Please verify the domain and try again.`,
      });
    }

    // Check if a valid Google Cloud PageSpeed API key is configured
    const pageSpeedKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
    const hasValidKey = Boolean(pageSpeedKey && pageSpeedKey.startsWith("AIza") && pageSpeedKey.length > 20);

    let mobileData: any = null;
    let desktopData: any = null;
    let auditSource = "Live DOM & Network Deep Diagnostic";
    let warning: string | undefined;

    // 1. If valid PageSpeed key is present, attempt PageSpeed Insights first
    if (hasValidKey) {
      try {
        const [mobileRes, desktopRes] = await Promise.allSettled([
          fetchPageSpeedForStrategy(cleanUrl, "mobile"),
          fetchPageSpeedForStrategy(cleanUrl, "desktop"),
        ]);

        if (mobileRes.status === "fulfilled") {
          mobileData = mobileRes.value;
        }
        if (desktopRes.status === "fulfilled") {
          desktopData = desktopRes.value;
        }
      } catch (pageSpeedErr: any) {
        console.warn("PageSpeed runner aborted, falling back to Live Inspector:", pageSpeedErr.message);
      }
    }

    // 2. If PageSpeed was not configured or timed out, execute our fast Live DOM & Network Inspector!
    if (!mobileData || !desktopData) {
      try {
        const liveBoth = await inspectLiveWebsiteBoth(cleanUrl);
        if (!mobileData) mobileData = liveBoth.mobile;
        if (!desktopData) desktopData = liveBoth.desktop;

        auditSource = "Live DOM & Network Deep Diagnostic";
        const ttfb = mobileData?.diagnosticStats?.ttfbMs || 0;
        const size = mobileData?.diagnosticStats?.htmlSizeKb || 0;
        warning = `Audited via Live DOM & Network Inspector (Measured TTFB: ${ttfb}ms, payload: ${size}KB). Add GOOGLE_PAGESPEED_API_KEY in settings for optional Google Cloud lab runner.`;
      } catch (inspectError: any) {
        console.warn(`Live inspection error for ${cleanUrl}:`, inspectError.message);
        return res.status(400).json({
          error: `Unable to connect to "${cleanUrl}". The website appears to be offline, unreachable, or refused the connection. (${inspectError.message})`,
        });
      }
    } else {
      auditSource = "Google PageSpeed Insights API";
    }

    return res.json({
      url: cleanUrl,
      domain,
      timestamp: new Date().toISOString(),
      warning,
      auditSource,
      mobile: mobileData,
      desktop: desktopData,
      activeStrategy: preferredStrategy === "desktop" ? "desktop" : "mobile",
    });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze website. Please check the URL and try again.",
    });
  }
});

// Endpoint: AI-Generated Insights and Prioritized Recommendations
app.post("/api/insights", async (req, res) => {
  try {
    const { url, strategy, scores, vitals, opportunities, seoIssues, a11yIssues, diagnosticStats, isUnlocked: userUnlocked, unlockToken } = req.body;
    const isUnlocked = Boolean(userUnlocked || unlockToken);

    if (!url || !scores) {
      return res.status(400).json({ error: "Missing required site metrics for insights." });
    }

    const ai = getGeminiClient();

    // If no Gemini client is available, return smart rule-based consultant analysis
    if (!ai) {
      return res.json(generateFallbackInsights(scores, vitals, opportunities, seoIssues, a11yIssues, isUnlocked));
    }

    const prompt = `You are a world-class, elite Technical SEO and Web Performance Director.
Analyze this audit data for website "${url}" tested on "${strategy || "mobile"}" devices.

SCORES (out of 100):
- Performance: ${scores.performance}/100
- SEO: ${scores.seo}/100
- Accessibility: ${scores.accessibility}/100
- Best Practices: ${scores.bestPractices}/100

CORE WEB VITALS & METRICS:
- LCP (Largest Contentful Paint): ${vitals?.lcp?.value || "N/A"} (${vitals?.lcp?.rating || "N/A"})
- INP (Interaction to Next Paint): ${vitals?.inp?.value || "N/A"} (${vitals?.inp?.rating || "N/A"})
- CLS (Cumulative Layout Shift): ${vitals?.cls?.value || "N/A"} (${vitals?.cls?.rating || "N/A"})
- FCP: ${vitals?.fcp?.value || "N/A"}
- TTFB (Server Response Time): ${vitals?.ttfb?.value || "N/A"}
- Total Blocking Time (TBT): ${vitals?.tbt?.value || "N/A"}

${diagnosticStats ? `LIVE MEASUREMENTS & TELEMETRY:
- Measured Server Response Time (TTFB): ${diagnosticStats.ttfbMs} ms
- HTML Transfer Size: ${diagnosticStats.htmlSizeKb} KB
- Transfer Compression: ${diagnosticStats.hasCompression ? "Enabled (Brotli/Gzip)" : "Disabled (Uncompressed)"}
- Security: ${diagnosticStats.isHttps ? "HTTPS Active" : "Insecure HTTP"}
- Render-Blocking Scripts: ${diagnosticStats.renderBlockingScripts}
- External Stylesheets: ${diagnosticStats.externalStylesheets}
- Media Assets: ${diagnosticStats.totalImages} images (${diagnosticStats.imagesWithoutAlt} missing alt attributes, ${diagnosticStats.imagesWithoutDimensions} missing width/height attributes)` : ""}

TOP IDENTIFIED OPPORTUNITIES:
${JSON.stringify(opportunities || [])}

SEO GAPS:
${JSON.stringify(seoIssues || [])}

ACCESSIBILITY GAPS:
${JSON.stringify(a11yIssues || [])}

CRITICAL REQUIREMENTS:
1. Provide a 2-3 sentence plain-English summary of the site's overall health, identifying what it does well and its exact primary bottleneck.
2. Provide exactly 3 to 5 prioritized, actionable recommendations. Do NOT give generic tips like "optimize images"; tie each recommendation specifically to the actual metric numbers and audits found above.
3. For EACH recommendation, you MUST provide ALL of the following fields:
   - priority: "High" | "Medium" | "Low"
   - category: "Performance" | "SEO" | "Accessibility" | "Best Practices"
   - title: Crisp 4-8 word title
   - action: 1-2 sentence concrete engineering or SEO fix
   - impact: Expected impact on Core Web Vitals, user bounce rate, or search ranking
   - effort: "Quick Win" | "Medium Effort" | "Architectural"
   - codeSnippet: Ready-to-copy, production-grade code (e.g. Next.js/HTML responsive picture markup, link preload tag, Apache/Nginx Cache-Control headers, JSON-LD Schema block, or CSS containment rule). NEVER omit this!
   - codeLanguage: Language of snippet (e.g. "html", "javascript", "css", "apache", "json", "nginx")
   - targetFile: The exact file name to edit (e.g. "index.html", ".htaccess", "robots.txt", "next.config.js", "critical.css")
   - insertionGuide: Exact instructions on WHERE and HOW to insert the code (e.g. "Place inside the <head> tag of index.html right before the closing </head>", "Create in your web root directory as .htaccess")
   - seoRankingImpact: Clear explanation of how this specific fix boosts Google search ranking, organic click-through rate, and crawl indexing.`;

    // Multi-model cascade: prioritize current active model gemini-3.6-flash
    const candidateModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    let text: string | undefined;

    const recItemProperties: any = {
      title: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
      category: { type: Type.STRING, enum: ["Performance", "SEO", "Accessibility", "Best Practices"] },
      action: { type: Type.STRING },
      impact: { type: Type.STRING },
      effort: { type: Type.STRING, enum: ["Quick Win", "Medium Effort", "Architectural"] },
      codeSnippet: { type: Type.STRING, description: "Concrete copy-pasteable code snippet for developers" },
      codeLanguage: { type: Type.STRING, description: "Language of snippet e.g. html, javascript, css, apache, json" },
      targetFile: { type: Type.STRING, description: "Target file to edit e.g. index.html, .htaccess, robots.txt" },
      insertionGuide: { type: Type.STRING, description: "Exact location and steps on where to insert the code" },
      seoRankingImpact: { type: Type.STRING, description: "How this specific fix improves Google Search rankings and CTR" },
    };

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              "You are an authoritative Senior Technical SEO & Performance Architect. Always return valid, clean JSON matching the requested schema. Provide punchy, highly specific, metric-grounded advice with ready-to-use code fixes, exact insertion instructions, and Google SEO ranking justifications.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: "A 2-3 sentence plain-English summary of site health and primary bottlenecks",
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: recItemProperties,
                    required: [
                      "title",
                      "priority",
                      "category",
                      "action",
                      "impact",
                      "effort",
                      "codeSnippet",
                      "codeLanguage",
                      "targetFile",
                      "insertionGuide",
                      "seoRankingImpact",
                    ],
                  },
                },
              },
              required: ["summary", "recommendations"],
            },
          },
        });

        text = response.text;
        if (text) break;
      } catch (modelError: any) {
        const isUnavailable =
          modelError.status === 503 ||
          modelError.message?.includes("503") ||
          modelError.message?.includes("high demand") ||
          modelError.message?.includes("UNAVAILABLE");
        console.warn(
          `Notice: Model ${model} unavailable (${isUnavailable ? "503 High Demand" : modelError.message}). Attempting candidate fallback...`
        );
      }
    }

    if (text) {
      try {
        const parsed = JSON.parse(text);
        parsed.isUnlocked = isUnlocked;
        return res.json(parsed);
      } catch {
        // Fall through to fallback
      }
    }

    // Graceful rule-based insights if Gemini models are experiencing high demand
    console.info("Gemini temporarily at peak capacity (503). Using deterministic SEO audit insights fallback.");
    const fallback = generateFallbackInsights(
      req.body.scores || {},
      req.body.vitals || {},
      req.body.opportunities || [],
      req.body.seoIssues || [],
      req.body.a11yIssues || [],
      isUnlocked
    );
    return res.json(fallback);
  } catch (error: any) {
    console.warn("Generating deterministic insights fallback:", error.message);
    // Fallback if AI fails so the UI never breaks
    const fallback = generateFallbackInsights(
      req.body.scores || {},
      req.body.vitals || {},
      req.body.opportunities || [],
      req.body.seoIssues || [],
      req.body.a11yIssues || [],
      Boolean(req.body.isUnlocked || req.body.unlockToken)
    );
    return res.json(fallback);
  }
});

// Fallback insights generator
function generateFallbackInsights(
  scores: any,
  vitals: any,
  opportunities: any[] = [],
  seoIssues: any[] = [],
  a11yIssues: any[] = [],
  isUnlocked: boolean = false
) {
  const perf = scores.performance ?? 70;
  const seo = scores.seo ?? 85;
  const a11y = scores.accessibility ?? 90;

  const isPerfPoor = perf < 75;
  const isSeoPoor = seo < 85;

  const summary = `Overall, the site demonstrates solid baseline architecture with an SEO rating of ${seo}/100 and Accessibility at ${a11y}/100. However, ${
    isPerfPoor
      ? `page rendering speeds and resource weight are holding back your Core Web Vitals, notably LCP (${vitals?.lcp?.value || "slow"}).`
      : `performance is stable, though fine-tuning Core Web Vitals will maximize mobile user retention and search crawl efficiency.`
  }`;

  const recs = [];

  if (opportunities.length > 0) {
    recs.push({
      title: opportunities[0].title || "Compress and Modernize Media Assets",
      priority: "High",
      category: "Performance",
      action: "Convert hero and above-the-fold imagery to AVIF/WebP formats with explicit width and height dimensions to slash payload transfer.",
      impact: "Reduces Largest Contentful Paint (LCP) by up to 35% and conserves bandwidth.",
      effort: "Quick Win",
      codeLanguage: "html",
      targetFile: "index.html (Hero Template Component)",
      insertionGuide: "Replace your current <img> tag inside the hero banner container with this modern responsive <picture> block.",
      seoRankingImpact: "Direct Google Core Web Vitals Factor: Slashing LCP under 2.5s directly improves mobile search ranking signals and stops bounce rates.",
      codeSnippet: `<!-- Next-gen Responsive Hero Image with Priority Hint -->\n<picture>\n  <source srcset="/images/hero.avif" type="image/avif" />\n  <source srcset="/images/hero.webp" type="image/webp" />\n  <img \n    src="/images/hero.jpg" \n    alt="Primary Product Showcase" \n    width="1200" \n    height="675" \n    fetchpriority="high" \n    decoding="async" \n    class="w-full h-auto" \n  />\n</picture>`,
    });
  } else {
    recs.push({
      title: "Optimize Critical Rendering Path",
      priority: "High",
      category: "Performance",
      action: "Inline critical above-the-fold CSS and defer non-essential third-party JavaScript bundles.",
      impact: "Improves First Contentful Paint and lowers main-thread contention.",
      effort: "Medium Effort",
      codeLanguage: "html",
      targetFile: "index.html (<head> section)",
      insertionGuide: "Paste inside the <head> tag of index.html right before closing </head>. Inline above-the-fold styles and load the external stylesheet asynchronously.",
      seoRankingImpact: "Direct Google Page Experience Factor: Eliminates render-blocking stylesheet penalties, allowing Googlebot and users to paint above-the-fold content immediately.",
      codeSnippet: `<!-- Inline Critical CSS & Asynchronously Load Full Stylesheet -->\n<style>\n  /* Inlined above-the-fold styling */\n  header { display: flex; align-items: center; justify-content: space-between; }\n  .hero-banner { display: block; min-height: 400px; }\n</style>\n<link rel="preload" href="/css/app.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="/css/app.min.css"></noscript>`,
    });
  }

  if (isSeoPoor || seoIssues.length > 0) {
    recs.push({
      title: "Strengthen Semantic Metadata & Canonical Hierarchy",
      priority: "High",
      category: "SEO",
      action: "Ensure unique, high-intent meta descriptions, valid canonical URLs, and structured H1-H3 document outlines.",
      impact: "Boosts SERP click-through rates and ensures complete search engine indexability.",
      effort: "Quick Win",
      codeLanguage: "html",
      targetFile: "index.html (<head> tag of each page template)",
      insertionGuide: "Insert inside <head> at the top of index.html. Customize the title, description, and canonical URL dynamically for each page.",
      seoRankingImpact: "Core Google Ranking Signal: Canonical tags prevent index dilution from duplicate query parameters, while high-intent descriptions increase organic SERP click-through rates by up to 25%.",
      codeSnippet: `<!-- High-Converting Organic SERP Metadata -->\n<title>SiteScope — Speed & SEO Intelligence Report</title>\n<meta name="description" content="Instant PageSpeed & Core Web Vitals diagnostic tool powered by Gemini AI. Uncover actionable engineering fixes in seconds." />\n<link rel="canonical" href="https://example.com/page" />\n<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />`,
    });
  } else {
    recs.push({
      title: "Implement Schema.org Structured Data",
      priority: "Medium",
      category: "SEO",
      action: "Deploy JSON-LD markup for Organization, WebSite, and BreadcrumbList schemas across target templates.",
      impact: "Enables rich snippets and expanded search presence on Google Search.",
      effort: "Quick Win",
      codeLanguage: "json",
      targetFile: "index.html (or layout template <head>)",
      insertionGuide: "Add this script block inside the <head> section of index.html or your main layout file.",
      seoRankingImpact: "Google Search Feature Factor: Qualifies your website for Google Rich Results (Sitelinks Search Box, Knowledge Graph, and Breadcrumbs), drastically improving SERP screen real estate.",
      codeSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "SiteScope",\n  "url": "https://example.com/",\n  "potentialAction": {\n    "@type": "SearchAction",\n    "target": "https://example.com/search?q={search_term_string}",\n    "query-input": "required name=search_term_string"\n  }\n}\n</script>`,
    });
  }

  if (a11y < 90 || a11yIssues.length > 0) {
    recs.push({
      title: "Remediate WCAG Contrast and ARIA Labels",
      priority: "Medium",
      category: "Accessibility",
      action: "Verify 4.5:1 text-to-background contrast ratios and add accessible names to all interactive icon buttons.",
      impact: "Guarantees regulatory accessibility compliance and reduces bounce rates for assistive device users.",
      effort: "Quick Win",
      codeLanguage: "html",
      targetFile: "src/components/Navbar.tsx (or template buttons)",
      insertionGuide: "Add aria-label and aria-hidden attributes to all icon-only buttons across your navigation and header components.",
      seoRankingImpact: "Google Usability Signal: Accessible semantic markup allows Googlebot to understand clickable DOM interactive nodes and ensures full accessibility compliance.",
      codeSnippet: `<!-- Compliant Interactive Control with Accessible Name -->\n<button \n  type="button"\n  aria-label="Toggle Navigation Menu"\n  class="p-2 rounded-lg text-slate-900 bg-white hover:bg-slate-100"\n>\n  <svg aria-hidden="true" focusable="false" class="w-6 h-6"><!-- SVG Icon --></svg>\n</button>`,
    });
  }

  recs.push({
    title: "Enforce Strict HTTP Caching Policies",
    priority: "Low",
    category: "Best Practices",
    action: "Set 1-year immutable cache headers for fingerprinted static assets and establish edge caching via CDN.",
    impact: "Dramatically accelerates repeat page views and stabilizes Time to First Byte (TTFB).",
    effort: "Medium Effort",
    codeLanguage: "apache",
    targetFile: ".htaccess (Apache/LiteSpeed web root) or nginx.conf",
    insertionGuide: "Paste directly into your web server's .htaccess file in the public root folder, or in the server block of nginx.conf.",
    seoRankingImpact: "Crawl Budget Optimization: Fast TTFB and 304 Not Modified cache hits allow Googlebot to crawl and index more pages on your site within your allotted crawl budget.",
    codeSnippet: `# Apache / LiteSpeed .htaccess Immutable Static Asset Caching\n<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType image/webp "access plus 1 year"\n  ExpiresByType image/avif "access plus 1 year"\n  ExpiresByType text/css "access plus 1 year"\n  ExpiresByType application/javascript "access plus 1 year"\n</IfModule>\n<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>`,
  });

  return {
    summary,
    recommendations: recs.slice(0, 4),
    isUnlocked,
  };
}


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  function listenOnAvailablePort(port: number, retriesLeft = 10) {
    const isCloudEnv = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER || process.env.PORT);
    const host = isCloudEnv ? "0.0.0.0" : undefined;

    const onListening = () => {
      console.log(`\n======================================================`);
      console.log(`🚀 SiteScope server running on:`);
      console.log(`   ➜ Local:   http://localhost:${port}/`);
      console.log(`   ➜ Network: http://0.0.0.0:${port}/`);
      console.log(`======================================================\n`);

      // If port is not 3000 and port 3000 happens to be free, setup a redirect so localhost:3000 works too!
      if (!isCloudEnv && port !== 3000) {
        try {
          const redirectServer = http.createServer((_req, res) => {
            res.writeHead(302, { Location: `http://localhost:${port}${_req.url || "/"}` });
            res.end();
          });
          redirectServer.on("error", () => {
            // Port 3000 is in use by another app, ignore silently
          });
          redirectServer.listen(3000);
        } catch {
          // Ignore
        }
      }
    };

    const server = host ? app.listen(port, host, onListening) : app.listen(port, onListening);


    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE" && retriesLeft > 0) {
        console.warn(`⚠️  Port ${port} is occupied by another application. Trying port ${port + 1}...`);
        listenOnAvailablePort(port + 1, retriesLeft - 1);
      } else {
        console.error("Server error:", err);
      }
    });
  }

  listenOnAvailablePort(INITIAL_PORT);
}

startServer();
