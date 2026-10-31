import type { SleepSession } from "@/lib/contracts/sleep";

export const ANALYTICS_VERSION = "1.0.0";

export function computeSleepEfficiency(session: SleepSession): number | null {
  if (session.inBedMinutes <= 0) return null;
  const asleep =
    session.lightMinutes + session.deepMinutes + session.remMinutes;
  return Math.round((asleep / session.inBedMinutes) * 100 * 10) / 10;
}

export function computeSleepScore(session: SleepSession): number | null {
  const efficiency = computeSleepEfficiency(session);
  if (efficiency === null) return null;

  const totalSleep =
    session.lightMinutes + session.deepMinutes + session.remMinutes;
  const optimalMinutes = 480;
  const durationFactor = Math.min(totalSleep / optimalMinutes, 1);

  const deepFraction = totalSleep > 0 ? session.deepMinutes / totalSleep : 0;
  const remFraction = totalSleep > 0 ? session.remMinutes / totalSleep : 0;

  const optimalDeep = 0.2;
  const optimalRem = 0.25;

  const deepScore = 1 - Math.abs(deepFraction - optimalDeep) / optimalDeep;
  const remScore = 1 - Math.abs(remFraction - optimalRem) / optimalRem;

  const raw =
    efficiency * 0.4 +
    durationFactor * 100 * 0.3 +
    Math.max(0, deepScore) * 100 * 0.15 +
    Math.max(0, remScore) * 100 * 0.15;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function computeSleepDebt(
  sessions: SleepSession[],
  targetMinutes: number = 480
): number {
  if (sessions.length === 0) return 0;
  const recentSessions = sessions.slice(-7);
  const avgSleep =
    recentSessions.reduce((s, sess) => {
      return s + sess.lightMinutes + sess.deepMinutes + sess.remMinutes;
    }, 0) / recentSessions.length;
  return Math.max(0, targetMinutes - avgSleep);
}

export function identifySleepConsistency(
  sessions: SleepSession[]
): "consistent" | "variable" | "irregular" | "insufficient" {
  if (sessions.length < 5) return "insufficient";
  const startTimes = sessions.map((s) => {
    const date = new Date(s.startMs);
    return date.getHours() * 60 + date.getMinutes();
  });
  const mean = startTimes.reduce((s, v) => s + v, 0) / startTimes.length;
  const variance =
    startTimes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
    startTimes.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev < 30) return "consistent";
  if (stdDev < 60) return "variable";
  return "irregular";
}

