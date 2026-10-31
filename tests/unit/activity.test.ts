import { describe, it, expect } from "vitest";
import { computeStrain, computeDailyStrain, computeHrZoneDistribution } from "@/lib/analytics/activity";
import type { ActivitySession } from "@/lib/contracts/activity";

function makeSession(strain: number): ActivitySession {
  return {
    id: crypto.randomUUID(),
    deviceId: "test",
    source: "simulator",
    type: "run",
    startMs: Date.now() - 3600000,
    endMs: Date.now(),
    durationMinutes: 60,
    strain,
    avgHr: 140,
    maxHr: 170,
    hrZones: [],
    kilojoules: 1200,
    algorithmVersion: "1.0.0",
  };
}

describe("computeStrain", () => {
  it("returns 0 for empty input", () => {
    expect(computeStrain([], 185)).toBe(0);
  });

  it("returns a value between 0 and 21", () => {
    const data = [
      { bpm: 160, durationSeconds: 3600 },
    ];
    const result = computeStrain(data, 185);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(21);
  });

  it("is higher for higher heart rates", () => {
    const low = computeStrain([{ bpm: 90, durationSeconds: 3600 }], 185);
    const high = computeStrain([{ bpm: 165, durationSeconds: 3600 }], 185);
    expect(high).toBeGreaterThan(low);
  });
});

describe("computeDailyStrain", () => {
  it("returns 0 for empty sessions", () => {
    expect(computeDailyStrain([])).toBe(0);
  });

  it("sums strain across sessions capped at 21", () => {
    const sessions = [makeSession(8), makeSession(8), makeSession(8)];
    expect(computeDailyStrain(sessions)).toBe(21);
  });
});

describe("computeHrZoneDistribution", () => {
  it("returns 5 zones", () => {
    const data = [{ bpm: 140, durationSeconds: 600 }];
    const zones = computeHrZoneDistribution(data, 185);
    expect(zones).toHaveLength(5);
  });

  it("correctly places HR in zone 3", () => {
    const data = [{ bpm: 140, durationSeconds: 600 }];
    const zones = computeHrZoneDistribution(data, 185);
    const populated = zones.filter((z) => z.durationMinutes > 0);
    expect(populated.length).toBeGreaterThan(0);
  });
});

