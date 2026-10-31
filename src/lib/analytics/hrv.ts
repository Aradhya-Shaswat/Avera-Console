import { filterArtifactIntervals, ANALYTICS_VERSION } from "./heart-rate";
import type { HrvMetrics } from "@/lib/contracts/measurement";

export { ANALYTICS_VERSION };

export function computeRmssd(intervalsMs: number[]): number | null {
  const clean = filterArtifactIntervals(intervalsMs);
  if (clean.length < 5) return null;
  const diffs = clean.slice(1).map((v, i) => Math.pow(v - clean[i], 2));
  const rmssd = Math.sqrt(diffs.reduce((s, v) => s + v, 0) / diffs.length);
  return Math.round(rmssd * 10) / 10;
}

export function computeSdnn(intervalsMs: number[]): number | null {
  const clean = filterArtifactIntervals(intervalsMs);
  if (clean.length < 5) return null;
  const mean = clean.reduce((s, v) => s + v, 0) / clean.length;
  const variance = clean.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / clean.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

export function computePnn50(intervalsMs: number[]): number | null {
  const clean = filterArtifactIntervals(intervalsMs);
  if (clean.length < 5) return null;
  const nn50 = clean.slice(1).filter((v, i) => Math.abs(v - clean[i]) > 50).length;
  return Math.round(((nn50 / (clean.length - 1)) * 100) * 10) / 10;
}

export function normalizeHrv(
  rmssd: number,
  personalBaseline: { mean: number; sd: number } | null
): number | null {
  if (!personalBaseline || personalBaseline.sd === 0) return null;
  return (rmssd - personalBaseline.mean) / personalBaseline.sd;
}

export function classifyHrvTrend(
  recent: number[],
  windowDays: number = 7
): "improving" | "stable" | "declining" | "insufficient" {
  if (recent.length < windowDays) return "insufficient";
  const half = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, half);
  const secondHalf = recent.slice(half);
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const delta = avg(secondHalf) - avg(firstHalf);
  const threshold = 2;
  if (delta > threshold) return "improving";
  if (delta < -threshold) return "declining";
  return "stable";
}

export function computeOvernightHrv(
  hrvSamples: HrvMetrics[]
): number | null {
  if (hrvSamples.length === 0) return null;
  const rmssdValues = hrvSamples.map((h) => h.rmssd);
  const median = [...rmssdValues].sort((a, b) => a - b);
  const mid = Math.floor(median.length / 2);
  return median.length % 2 === 0
    ? (median[mid - 1] + median[mid]) / 2
    : median[mid];
}

