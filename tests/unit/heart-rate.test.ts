import { describe, it, expect } from "vitest";
import {
  computeRestingHr,
  computeMeanHr,
  computePeakHr,
  filterArtifactIntervals,
  computeHrZoneBoundaries,
  estimateMaxHr,
  computeHrvMetrics,
} from "@/lib/analytics/heart-rate";
import type { HeartRateRecord } from "@/lib/contracts/measurement";

function makeRecord(bpm: number): HeartRateRecord {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    deviceId: "test",
    source: "simulator",
    bpm,
  };
}

describe("computeRestingHr", () => {
  it("returns null for fewer than 5 records", () => {
    const records = [60, 62, 64].map(makeRecord);
    expect(computeRestingHr(records)).toBeNull();
  });

  it("returns the bottom 10th percentile average", () => {
    const bpms = [55, 58, 60, 62, 65, 70, 72, 75, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
    const records = bpms.map(makeRecord);
    const result = computeRestingHr(records);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(65);
  });

  it("rejects invalid bpm values", () => {
    const records = [0, 15, 20, 300, 400].map(makeRecord);
    expect(computeRestingHr(records)).toBeNull();
  });
});

describe("computeMeanHr", () => {
  it("returns null for empty input", () => {
    expect(computeMeanHr([])).toBeNull();
  });

  it("computes mean correctly", () => {
    const records = [60, 70, 80].map(makeRecord);
    expect(computeMeanHr(records)).toBe(70);
  });

  it("filters out-of-range values", () => {
    const records = [60, 70, 400].map(makeRecord);
    const result = computeMeanHr(records);
    expect(result).toBe(65);
  });
});

describe("computePeakHr", () => {
  it("returns null for empty input", () => {
    expect(computePeakHr([])).toBeNull();
  });

  it("returns the maximum valid bpm", () => {
    const records = [60, 120, 180].map(makeRecord);
    expect(computePeakHr(records)).toBe(180);
  });
});

describe("filterArtifactIntervals", () => {
  it("returns input unchanged for fewer than 3 values", () => {
    const intervals = [800, 810];
    expect(filterArtifactIntervals(intervals)).toEqual(intervals);
  });

  it("removes large outliers", () => {
    const intervals = [800, 810, 820, 800, 3000, 810];
    const filtered = filterArtifactIntervals(intervals);
    expect(filtered).not.toContain(3000);
  });

  it("keeps normal variability", () => {
    const intervals = [800, 810, 820, 830, 815, 805];
    const filtered = filterArtifactIntervals(intervals);
    expect(filtered.length).toBe(intervals.length);
  });
});

describe("computeHrZoneBoundaries", () => {
  it("returns 5 zones", () => {
    const zones = computeHrZoneBoundaries(185);
    expect(zones).toHaveLength(5);
  });

  it("zone 5 max equals max HR", () => {
    const zones = computeHrZoneBoundaries(185);
    expect(zones[4].max).toBe(185);
  });
});

describe("estimateMaxHr", () => {
  it("uses Tanaka formula", () => {
    expect(estimateMaxHr(30)).toBe(187);
    expect(estimateMaxHr(40)).toBe(180);
  });
});

describe("computeHrvMetrics", () => {
  it("returns null for fewer than 5 intervals", () => {
    expect(computeHrvMetrics([800, 810, 820, 815], 0, 1000, "simulator")).toBeNull();
  });

  it("computes rmssd deterministically", () => {
    const intervals = [800, 810, 790, 820, 800, 815, 795, 810, 800, 825];
    const result1 = computeHrvMetrics(intervals, 0, 10000, "simulator");
    const result2 = computeHrvMetrics(intervals, 0, 10000, "simulator");
    expect(result1).not.toBeNull();
    expect(result1?.rmssd).toBe(result2?.rmssd);
  });

  it("rmssd is positive", () => {
    const intervals = [800, 810, 790, 820, 800, 815];
    const result = computeHrvMetrics(intervals, 0, 10000, "simulator");
    expect(result?.rmssd).toBeGreaterThan(0);
  });
});

