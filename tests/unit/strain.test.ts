import { describe, it, expect } from "vitest";
import { computeDayStrain, computeStrainLoad, computeAcuteChronicRatio } from "@/lib/analytics/strain";

describe("computeDayStrain", () => {
  it("returns 0 for empty data", () => {
    expect(computeDayStrain([], 185)).toBe(0);
  });

  it("returns a value capped at 21", () => {
    const data = Array(10).fill({ bpm: 180, durationSeconds: 3600 });
    expect(computeDayStrain(data, 185)).toBeLessThanOrEqual(21);
  });
});

describe("computeStrainLoad", () => {
  it("sums recent strain values", () => {
    expect(computeStrainLoad([10, 12, 8, 14, 9, 11, 13])).toBe(77);
  });

  it("uses last N days", () => {
    expect(computeStrainLoad([10, 10, 10, 10, 10, 10, 10, 5, 5, 5], 7)).toBe(55);
  });
});

describe("computeAcuteChronicRatio", () => {
  it("returns null when insufficient data", () => {
    expect(computeAcuteChronicRatio([10, 12, 13], 7, 28)).toBeNull();
  });

  it("returns a ratio when data is sufficient", () => {
    const data = Array(28).fill(10);
    const ratio = computeAcuteChronicRatio(data, 7, 28);
    expect(ratio).not.toBeNull();
    expect(ratio).toBeCloseTo(1.0, 2);
  });
});
