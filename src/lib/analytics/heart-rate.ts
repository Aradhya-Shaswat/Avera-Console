import type { HeartRateRecord, HrvMetrics, SignalQuality } from "@/lib/contracts/measurement";

export const ANALYTICS_VERSION = "1.0.0";

const MIN_VALID_BPM = 25;
const MAX_VALID_BPM = 250;
const ARTIFACT_THRESHOLD_RATIO = 0.25;

export function computeRestingHr(records: HeartRateRecord[]): number | null {
  const valid = records
    .filter((r) => r.bpm >= MIN_VALID_BPM && r.bpm <= MAX_VALID_BPM)
    .map((r) => r.bpm)
    .sort((a, b) => a - b);

  if (valid.length < 5) return null;

  const bottom10Percent = Math.max(1, Math.floor(valid.length * 0.1));
  const slice = valid.slice(0, bottom10Percent);
  return Math.round(slice.reduce((s, v) => s + v, 0) / slice.length);
}

export function computeMeanHr(records: HeartRateRecord[]): number | null {
  const valid = records.filter(
    (r) => r.bpm >= MIN_VALID_BPM && r.bpm <= MAX_VALID_BPM
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce((s, r) => s + r.bpm, 0);
  return Math.round(sum / valid.length);
}

export function computePeakHr(records: HeartRateRecord[]): number | null {
  const valid = records.filter(
    (r) => r.bpm >= MIN_VALID_BPM && r.bpm <= MAX_VALID_BPM
  );
  if (valid.length === 0) return null;
  return Math.max(...valid.map((r) => r.bpm));
}

export function classifyHeartRateQuality(bpm: number): SignalQuality {
  if (bpm < MIN_VALID_BPM || bpm > MAX_VALID_BPM) return "invalid";
  if (bpm >= 40 && bpm <= 160) return "excellent";
  if (bpm >= 30 && bpm <= 200) return "good";
  return "fair";
}

export function filterArtifactIntervals(intervalsMs: number[]): number[] {
  if (intervalsMs.length < 3) return intervalsMs;

  const median = computeMedian(intervalsMs);
  return intervalsMs.filter((iv) => {
    const ratio = Math.abs(iv - median) / median;
    return ratio <= ARTIFACT_THRESHOLD_RATIO;
  });
}

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function computeHrZoneBoundaries(maxHr: number): {
  zone: number;
  min: number;
  max: number;
}[] {
  const thresholds = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  return thresholds.slice(0, 5).map((lower, i) => ({
    zone: i + 1,
    min: Math.round(maxHr * lower),
    max: Math.round(maxHr * thresholds[i + 1]),
  }));
}

export function estimateMaxHr(ageYears: number): number {
  return Math.round(208 - 0.7 * ageYears);
}

export function computeHrvMetrics(
  intervalsMs: number[],
  windowStartMs: number,
  windowEndMs: number,
  source: HrvMetrics["source"]
): HrvMetrics | null {
  const clean = filterArtifactIntervals(intervalsMs);
  if (clean.length < 5) return null;

  const diffs = clean.slice(1).map((v, i) => Math.pow(v - clean[i], 2));
  const rmssd = Math.sqrt(diffs.reduce((s, v) => s + v, 0) / diffs.length);

  const mean = clean.reduce((s, v) => s + v, 0) / clean.length;
  const variance = clean.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / clean.length;
  const sdnn = Math.sqrt(variance);

  const nn50 = clean.slice(1).filter((v, i) => Math.abs(v - clean[i]) > 50).length;
  const pnn50 = (nn50 / (clean.length - 1)) * 100;

  return {
    rmssd: Math.round(rmssd * 10) / 10,
    sdnn: Math.round(sdnn * 10) / 10,
    pnn50: Math.round(pnn50 * 10) / 10,
    sampleCount: clean.length,
    algorithmVersion: ANALYTICS_VERSION,
    windowStartMs,
    windowEndMs,
    source,
  };
}

