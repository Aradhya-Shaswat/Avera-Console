import type { PpgSample } from "@/lib/contracts/measurement";

export type QualityAssessment = {
  quality: "excellent" | "good" | "fair" | "poor" | "invalid";
  score: number;
  reasons: string[];
};

export function assessPpgQuality(samples: PpgSample[]): QualityAssessment {
  if (samples.length < 10) {
    return {
      quality: "invalid",
      score: 0,
      reasons: ["Insufficient samples"],
    };
  }

  const greenValues = samples.map((s) => s.green);
  const snr = computeSnr(greenValues);
  const clipping = detectClipping(greenValues);
  const motion = assessMotionArtifact(greenValues);

  const reasons: string[] = [];
  let score = 100;

  if (snr < 10) {
    score -= 40;
    reasons.push("Low SNR");
  } else if (snr < 20) {
    score -= 20;
    reasons.push("Moderate SNR");
  }

  if (clipping) {
    score -= 30;
    reasons.push("Signal clipping detected");
  }

  if (motion > 0.3) {
    score -= 30;
    reasons.push("Motion artifact detected");
  }

  score = Math.max(0, Math.min(100, score));

  let quality: QualityAssessment["quality"];
  if (score >= 80) quality = "excellent";
  else if (score >= 60) quality = "good";
  else if (score >= 40) quality = "fair";
  else if (score >= 20) quality = "poor";
  else quality = "invalid";

  return { quality, score, reasons };
}

function computeSnr(values: number[]): number {
  if (values.length < 4) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const noise = Math.sqrt(variance);
  return noise === 0 ? 100 : mean / noise;
}

function detectClipping(values: number[]): boolean {
  const max = Math.max(...values);
  const clipped = values.filter((v) => v >= max * 0.99).length;
  return clipped / values.length > 0.05;
}

function assessMotionArtifact(values: number[]): number {
  if (values.length < 3) return 0;
  const diffs = values.slice(1).map((v, i) => Math.abs(v - values[i]));
  const maxDiff = Math.max(...diffs);
  const range = Math.max(...values) - Math.min(...values);
  return range === 0 ? 0 : maxDiff / range;
}

export function assessContactQuality(
  accelMagnitudes: number[]
): "good" | "poor" | "no_contact" {
  if (accelMagnitudes.length === 0) return "no_contact";
  const variance =
    accelMagnitudes.reduce((s, v) => s + Math.pow(v - 1, 2), 0) /
    accelMagnitudes.length;
  if (variance > 2) return "poor";
  return "good";
}

