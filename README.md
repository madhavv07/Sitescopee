# SiteScope - SEO & Core Web Vitals Intelligence Platform

> Modern, AI-powered Technical SEO and Web Performance Intelligence tool. Analyzes Core Web Vitals (LCP, INP, CLS), evaluates accessibility, security, and best practices, and delivers prioritized engineering fixes with copy-paste code snippets.

---

## 🚀 Key Features

- **Dual-Engine Audit**:
  - **Google PageSpeed Insights API**: Official Google Cloud lab runner metrics.
  - **Live DOM & Network Deep Diagnostic**: Real-time server response time (TTFB), payload compression, unminified assets, and meta tag crawler.
- **Core Web Vitals Telemetry**:
  - Largest Contentful Paint (LCP)
  - Interaction to Next Paint (INP)
  - Cumulative Layout Shift (CLS)
  - First Contentful Paint (FCP), Total Blocking Time (TBT), and Speed Index.
- **Gemini AI Consultant**:
  - Translates diagnostic audits into prioritized engineering action plans.
  - Generates ready-to-use production code snippets (HTML, CSS, Apache `.htaccess`, Nginx config, Next.js).
  - Specifies exact **target files**, **insertion guides**, and **Google SEO ranking impact** for every recommendation.
- **Micro-Payment Unlock**:
  - **Dodo Payments Integration**: Seamless checkout supporting Indian UPI (Google Pay, PhonePe, Paytm, BHIM) and international/domestic credit/debit cards.
  - Instant unlock for line-by-line developer fixes and downloadable executive reports.
  - RBI-compliant, automated GST invoicing via Merchant of Record.

---

## 💰 Pricing & Product Description

- **Single Report Pass**: **₹10 INR** (One-time micro-payment).
- **Deliverables**: Instant unlock of line-by-line code fixes, target file guidance, insertion instructions, and downloadable client-ready SEO executive audit.
- **Refund Policy**: If an audit fails to generate, the payment session is automatically refunded or credited.
- **Support**: For inquiries, contact `madhavgajjar7@gmail.com`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Recharts.
- **Backend**: Node.js, Express, Google GenAI SDK (`gemini-3.6-flash`), Google PageSpeed Online API v5.
- **Payment Processing**: Dodo Payments (UPI & Cards) with webhook validation and cryptographic signature verification.

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- NPM or Bun

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/sitescope.git
   cd sitescope
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY`, optional `GOOGLE_PAGESPEED_API_KEY`, and `DODO_PAYMENTS_API_KEY`.

4. Start development server:
   ```bash
   npm run dev
   ```
   Or build and run production:
   ```bash
   npm run build
   npm start
   ```

5. Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📄 License
MIT © 2026 Madhav Gajjar

