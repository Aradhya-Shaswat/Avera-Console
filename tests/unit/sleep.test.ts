import { describe, it, expect } from "vitest";
import {
  computeSleepScore,
  computeSleepEfficiency,
  computeSleepDebt,
  identifySleepConsistency,
} from "@/lib/analytics/sleep";
import type { SleepSession } from "@/lib/contracts/sleep";

function makeSession(overrides: Partial<SleepSession> = {}): SleepSession {
  const base: SleepSession = {
    id: crypto.randomUUID(),
    deviceId: "test",
    source: "simulator",
    startMs: Date.now() - 8 * 3600000,
    endMs: Date.now(),
    durationMinutes: 420,
    inBedMinutes: 480,
    awakeMinutes: 30,
    lightMinutes: 190,
    deepMinutes: 90,
    remMinutes: 110,
    cycles: 5,
    stages: [],
    avgHrDuringSleep: 52,
    avgHrvDuringSleep: 65,
    respiratoryDisturbanceIndex: 1.0,
    isEstimate: true,
    algorithmVersion: "1.0.0",
    ...overrides,
  };
  return base;
}

describe("computeSleepEfficiency", () => {
  it("calculates efficiency as sleep/in-bed", () => {
    const session = makeSession();
    const result = computeSleepEfficiency(session);
    const expected = ((190 + 90 + 110) / 480) * 100;
    expect(result).toBeCloseTo(expected, 1);
  });

  it("returns null when in-bed minutes is zero", () => {
    const session = makeSession({ inBedMinutes: 0 });
    expect(computeSleepEfficiency(session)).toBeNull();
  });
});

describe("computeSleepScore", () => {
  it("returns a score between 0 and 100", () => {
    const session = makeSession();
    const score = computeSleepScore(session);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(0);
    expect(score!).toBeLessThanOrEqual(100);
  });

  it("is deterministic", () => {
    const session = makeSession();
    expect(computeSleepScore(session)).toBe(computeSleepScore(session));
  });

  it("penalizes low efficiency", () => {
    const good = makeSession({ awakeMinutes: 10, inBedMinutes: 490 });
    const poor = makeSession({ awakeMinutes: 200, inBedMinutes: 490 });
    expect(computeSleepScore(good)!).toBeGreaterThanOrEqual(computeSleepScore(poor)!);
  });
});

describe("computeSleepDebt", () => {
  it("returns 0 for empty sessions", () => {
    expect(computeSleepDebt([])).toBe(0);
  });

  it("calculates positive debt when sleeping less than target", () => {
    const sessions = Array(7).fill(makeSession({ durationMinutes: 360 }));
    const debt = computeSleepDebt(sessions, 480);
    expect(debt).toBeGreaterThan(0);
  });

  it("returns 0 when meeting sleep target", () => {
    const sessions = Array(7).fill(makeSession({ lightMinutes: 220, deepMinutes: 100, remMinutes: 160 }));
    const debt = computeSleepDebt(sessions, 360);
    expect(debt).toBe(0);
  });
});
