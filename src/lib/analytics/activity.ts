import type { ActivitySession, HrZone } from "@/lib/contracts/activity";
import { computeHrZoneBoundaries } from "./heart-rate";

export const ANALYTICS_VERSION = "1.0.0";

export function computeStrain(
  hrRecordsWithTimestamps: { bpm: number; durationSeconds: number }[],
  maxHr: number
): number {
  if (hrRecordsWithTimestamps.length === 0) return 0;

  let strain = 0;
  for (const { bpm, durationSeconds } of hrRecordsWithTimestamps) {
    const hrRatio = bpm / maxHr;
    const zoneMultiplier = computeStrainZoneMultiplier(hrRatio);
    strain += (durationSeconds / 3600) * zoneMultiplier;
  }

  return Math.min(21, Math.round(strain * 10) / 10);
}

function computeStrainZoneMultiplier(hrRatio: number): number {
  if (hrRatio >= 0.9) return 8;
  if (hrRatio >= 0.8) return 5;
  if (hrRatio >= 0.7) return 3;
  if (hrRatio >= 0.6) return 1.5;
  if (hrRatio >= 0.5) return 0.5;
  return 0;
}

export function computeHrZoneDistribution(
  records: { bpm: number; durationSeconds: number }[],
  maxHr: number
): HrZone[] {
  const boundaries = computeHrZoneBoundaries(maxHr);
  const zones: HrZone[] = boundaries.map((b) => ({
    zone: b.zone,
    durationMinutes: 0,
    minBpm: b.min,
    maxBpm: b.max,
  }));

  for (const { bpm, durationSeconds } of records) {
    const zone = zones.find((z) => bpm >= z.minBpm && bpm < z.maxBpm);
    if (zone) {
      zone.durationMinutes += durationSeconds / 60;
    }
  }

  return zones.map((z) => ({
    ...z,
    durationMinutes: Math.round(z.durationMinutes * 10) / 10,
  }));
}

export function computeDailyStrain(sessions: ActivitySession[]): number {
  if (sessions.length === 0) return 0;
  return Math.min(
    21,
    Math.round(
      sessions.reduce((s, sess) => s + sess.strain, 0) * 10
    ) / 10
  );
}

export function computeKilojoules(
  avgHr: number,
  durationMinutes: number,
  weightKg: number = 70
): number {
  const met = estimateMet(avgHr);
  const kcal = (met * weightKg * (durationMinutes / 60));
  return Math.round(kcal * 4.184 * 10) / 10;
}

function estimateMet(avgHr: number): number {
  if (avgHr >= 170) return 12;
  if (avgHr >= 150) return 9;
  if (avgHr >= 130) return 7;
  if (avgHr >= 110) return 5;
  if (avgHr >= 90) return 3.5;
  return 2;
}

