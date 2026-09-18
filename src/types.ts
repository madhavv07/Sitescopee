export type Strategy = "mobile" | "desktop";

export type MetricRating = "Good" | "Needs Improvement" | "Poor";

export interface VitalMetric {
  value: string;
  rating?: MetricRating;
  score?: number;
}

export interface CoreWebVitals {
  lcp: VitalMetric;
  inp: VitalMetric;
  cls: VitalMetric;
  fcp?: VitalMetric;
  ttfb?: VitalMetric;
  speedIndex?: VitalMetric;
  tbt?: VitalMetric;
}

export interface OpportunityItem {
  title: string;
  displayValue?: string;
  description?: string;
}

export interface StrategyAuditData {
  strategy: Strategy;
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  vitals: CoreWebVitals;
  opportunities: OpportunityItem[];
  seoIssues: string[];
  a11yIssues: string[];
  diagnosticStats?: {
    status?: number;
    ttfbMs?: number;
    htmlSizeKb?: number;
    isHttps?: boolean;
    hasCompression?: boolean;
    totalImages?: number;
    imagesWithoutAlt?: number;
    imagesWithoutDimensions?: number;
    renderBlockingScripts?: number;
    externalStylesheets?: number;
  };
}

export interface Recommendation {
  title: string;
  priority: "High" | "Medium" | "Low";
  category: "Performance" | "SEO" | "Accessibility" | "Best Practices";
  action: string;
  impact: string;
  effort: "Quick Win" | "Medium Effort" | "Architectural";
  codeSnippet?: string;
  codeLanguage?: string;
  targetFile?: string;
  insertionGuide?: string;
  seoRankingImpact?: string;
}

export interface AIInsights {
  summary: string;
  recommendations: Recommendation[];
  isUnlocked?: boolean;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  isMock?: boolean;
}

export interface PaymentVerificationResult {
  success: boolean;
  unlockToken?: string;
  error?: string;
}


export interface AnalysisResult {
  id: string;
  url: string;
  domain: string;
  timestamp: string;
  activeStrategy: Strategy;
  mobile: StrategyAuditData;
  desktop: StrategyAuditData;
  insights: AIInsights;
  warning?: string;
  auditSource?: string;
  userId?: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
