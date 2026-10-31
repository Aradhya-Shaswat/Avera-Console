import { computeStrain } from "./activity";

export const ANALYTICS_VERSION = "1.0.0";

export function computeDayStrain(
  heartRateSamples: { bpm: number; durationSeconds: number }[],
  maxHr: number
): number {
  return computeStrain(heartRateSamples, maxHr);
}

export function computeStrainLoad(
  strainValues: number[],
  windowDays: number = 7
): number {
  if (strainValues.length === 0) return 0;
  const recent = strainValues.slice(-windowDays);
  return recent.reduce((s, v) => s + v, 0);
}

export function computeAcuteChronicRatio(
  recentStrain: number[],
  acuteWindowDays: number = 7,
  chronicWindowDays: number = 28
): number | null {
  if (recentStrain.length < acuteWindowDays) return null;
  const acute = recentStrain.slice(-acuteWindowDays);
  const chronic = recentStrain.slice(-chronicWindowDays);
  const acuteAvg = acute.reduce((s, v) => s + v, 0) / acute.length;
  const chronicAvg = chronic.reduce((s, v) => s + v, 0) / chronic.length;
  if (chronicAvg === 0) return null;
  return Math.round((acuteAvg / chronicAvg) * 100) / 100;
}

