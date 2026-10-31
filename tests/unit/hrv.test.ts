import { describe, it, expect } from "vitest";
import { computeRmssd, computeSdnn, computePnn50, classifyHrvTrend } from "@/lib/analytics/hrv";

describe("computeRmssd", () => {
  it("returns null for insufficient samples", () => {
    expect(computeRmssd([800, 810, 820])).toBeNull();
  });

  it("computes a positive rmssd", () => {
    const intervals = [800, 810, 790, 820, 800, 815, 795];
    const result = computeRmssd(intervals);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const intervals = [800, 810, 790, 820, 800, 815, 795];
    expect(computeRmssd(intervals)).toBe(computeRmssd(intervals));
  });
});

describe("computeSdnn", () => {
  it("returns null for insufficient samples", () => {
    expect(computeSdnn([800, 810])).toBeNull();
  });

  it("returns positive sdnn", () => {
    const intervals = [800, 810, 790, 820, 800];
    expect(computeSdnn(intervals)!).toBeGreaterThan(0);
  });
});

describe("computePnn50", () => {
  it("returns null for insufficient samples", () => {
    expect(computePnn50([800, 810])).toBeNull();
  });

  it("returns 0 when no consecutive differences exceed 50ms", () => {
    const intervals = [800, 810, 815, 808, 812, 806];
    const result = computePnn50(intervals);
    expect(result).toBe(0);
  });
});

describe("classifyHrvTrend", () => {
  it("returns insufficient when not enough data", () => {
    expect(classifyHrvTrend([50, 55, 60])).toBe("insufficient");
  });

  it("detects improving trend", () => {
    const data = [40, 42, 41, 43, 42, 44, 55, 58, 57, 60, 59, 62, 61, 63];
    expect(classifyHrvTrend(data)).toBe("improving");
  });

  it("detects declining trend", () => {
    const data = [60, 62, 61, 63, 62, 64, 50, 48, 47, 46, 45, 44, 43, 42];
    expect(classifyHrvTrend(data)).toBe("declining");
  });
});

