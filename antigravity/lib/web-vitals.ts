import { onCLS, onFID, onLCP, onINP, onTTFB, onFCP, type Metric } from 'web-vitals';

// Performance budgets (Core Web Vitals thresholds)
const PERFORMANCE_BUDGETS = {
  LCP: 2500, // Largest Contentful Paint < 2.5s
  CLS: 0.1,  // Cumulative Layout Shift < 0.1
  FID: 100,  // First Input Delay < 100ms
  INP: 200,  // Interaction to Next Paint < 200ms
  TTFB: 800, // Time to First Byte < 800ms
  FCP: 1800, // First Contentful Paint < 1.8s
} as const;

type MetricName = 'CLS' | 'FID' | 'LCP' | 'INP' | 'TTFB' | 'FCP';

const METRIC_NAMES: MetricName[] = ['CLS', 'FID', 'LCP', 'INP', 'TTFB', 'FCP'];

function getMetricName(metric: Metric): MetricName {
  return metric.name as MetricName;
}

function checkBudget(name: MetricName, value: number): void {
  const budget = PERFORMANCE_BUDGETS[name];
  if (budget === undefined) return;

  if (value > budget) {
    console.warn(
      `[Web Vitals] ⚠️ ${name} budget exceeded: ${value.toFixed(2)} (budget: ${budget})`
    );
  } else {
    console.log(
      `[Web Vitals] ✅ ${name} within budget: ${value.toFixed(2)} (budget: ${budget})`
    );
  }
}

function sendToAnalytics(metric: Metric): void {
  const name = getMetricName(metric);
  const value = metric.value;
  const id = metric.id;
  const delta = metric.delta;

  // Check performance budgets
  checkBudget(name, value);

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, {
      value: value.toFixed(2),
      delta: delta.toFixed(2),
      id,
      rating: metric.rating,
    });
    return;
  }

  // In production, send to analytics endpoint
  const body = JSON.stringify({
    name,
    value: Math.round(value * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    id,
    rating: metric.rating,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now(),
  });

  // Use sendBeacon for reliable delivery, fallback to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/v1/metrics', body);
  } else {
    fetch('/api/v1/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch((err) => {
      console.error('[Web Vitals] Failed to send metric:', err);
    });
  }
}

export function reportWebVitals(): void {
  try {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    onINP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onFCP(sendToAnalytics);
  } catch (error) {
    console.error('[Web Vitals] Error initializing:', error);
  }
}
