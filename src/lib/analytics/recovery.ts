export const ANALYTICS_VERSION = "1.0.0";

const MIN_STRAIN = 0;
const MAX_STRAIN = 21;

export function computeRecoveryScore(params: {
  overnightHrvRmssd: number | null;
  personalHrvBaseline: { mean: number; sd: number } | null;
  restingHr: number | null;
  personalRhrBaseline: { mean: number; sd: number } | null;
  sleepScore: number | null;
  previousDayStrain: number | null;
  spO2: number | null;
}): number | null {
  const {
    overnightHrvRmssd,
    personalHrvBaseline,
    restingHr,
    personalRhrBaseline,
    sleepScore,
    previousDayStrain,
    spO2,
  } = params;

  if (overnightHrvRmssd === null) return null;

  let score = 50;

  if (personalHrvBaseline && personalHrvBaseline.sd > 0) {
    const zHrv = (overnightHrvRmssd - personalHrvBaseline.mean) / personalHrvBaseline.sd;
    score += clamp(zHrv * 15, -30, 30);
  } else {
    const rawHrvBonus = Math.min(overnightHrvRmssd / 2, 20);
    score += rawHrvBonus - 10;
  }

  if (restingHr !== null && personalRhrBaseline && personalRhrBaseline.sd > 0) {
    const zRhr = (restingHr - personalRhrBaseline.mean) / personalRhrBaseline.sd;
    score -= clamp(zRhr * 10, -20, 20);
  }

  if (sleepScore !== null) {
    const sleepFactor = (sleepScore - 50) * 0.3;
    score += clamp(sleepFactor, -15, 15);
  }

  if (previousDayStrain !== null) {
    const strainNormalized = previousDayStrain / MAX_STRAIN;
    score -= strainNormalized * 10;
  }

  if (spO2 !== null && spO2 < 94) {
    score -= (94 - spO2) * 2;
  }

  return Math.round(clamp(score, 1, 100));
}

export function classifyRecovery(score: number): "green" | "yellow" | "red" {
  if (score >= 67) return "green";
  if (score >= 34) return "yellow";
  return "red";
}

export function recommendDailyStrain(
  recoveryScore: number
): { min: number; max: number; label: string } {
  if (recoveryScore >= 80) {
    return { min: 14, max: 18, label: "Push Day" };
  }
  if (recoveryScore >= 60) {
    return { min: 10, max: 14, label: "Moderate Effort" };
  }
  if (recoveryScore >= 40) {
    return { min: 6, max: 10, label: "Light Activity" };
  }
  return { min: 0, max: 6, label: "Rest Day" };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

