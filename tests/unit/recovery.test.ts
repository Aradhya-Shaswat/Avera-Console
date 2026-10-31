import { describe, it, expect } from "vitest";
import {
  computeRecoveryScore,
  classifyRecovery,
  recommendDailyStrain,
} from "@/lib/analytics/recovery";

describe("computeRecoveryScore", () => {
  it("returns null when HRV is null", () => {
    expect(
      computeRecoveryScore({
        overnightHrvRmssd: null,
        personalHrvBaseline: null,
        restingHr: null,
        personalRhrBaseline: null,
        sleepScore: null,
        previousDayStrain: null,
        spO2: null,
      })
    ).toBeNull();
  });

  it("returns a score between 1 and 100", () => {
    const score = computeRecoveryScore({
      overnightHrvRmssd: 65,
      personalHrvBaseline: { mean: 55, sd: 10 },
      restingHr: 55,
      personalRhrBaseline: { mean: 60, sd: 5 },
      sleepScore: 80,
      previousDayStrain: 8,
      spO2: 98,
    });
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(1);
    expect(score!).toBeLessThanOrEqual(100);
  });

  it("gives higher score for better HRV relative to baseline", () => {
    const highHrv = computeRecoveryScore({
      overnightHrvRmssd: 80,
      personalHrvBaseline: { mean: 55, sd: 10 },
      restingHr: null,
      personalRhrBaseline: null,
      sleepScore: null,
      previousDayStrain: null,
      spO2: null,
    });
    const lowHrv = computeRecoveryScore({
      overnightHrvRmssd: 30,
      personalHrvBaseline: { mean: 55, sd: 10 },
      restingHr: null,
      personalRhrBaseline: null,
      sleepScore: null,
      previousDayStrain: null,
      spO2: null,
    });
    expect(highHrv!).toBeGreaterThan(lowHrv!);
  });

  it("is deterministic", () => {
    const params = {
      overnightHrvRmssd: 55,
      personalHrvBaseline: { mean: 55, sd: 10 },
      restingHr: 58,
      personalRhrBaseline: { mean: 60, sd: 5 },
      sleepScore: 70,
      previousDayStrain: 10,
      spO2: 97,
    };
    expect(computeRecoveryScore(params)).toBe(computeRecoveryScore(params));
  });
});

describe("classifyRecovery", () => {
  it("classifies green at 67+", () => expect(classifyRecovery(70)).toBe("green"));
  it("classifies yellow between 34 and 66", () => expect(classifyRecovery(50)).toBe("yellow"));
  it("classifies red below 34", () => expect(classifyRecovery(20)).toBe("red"));
});

describe("recommendDailyStrain", () => {
  it("recommends rest for low recovery", () => {
    const rec = recommendDailyStrain(20);
    expect(rec.max).toBeLessThanOrEqual(6);
  });

  it("recommends push for high recovery", () => {
    const rec = recommendDailyStrain(90);
    expect(rec.min).toBeGreaterThanOrEqual(14);
  });
});

