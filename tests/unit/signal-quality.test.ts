import { describe, it, expect } from "vitest";
import { assessPpgQuality, assessContactQuality } from "@/lib/analytics/signal-quality";
import type { PpgSample } from "@/lib/contracts/measurement";

function makeSample(green: number): PpgSample {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    deviceId: "test",
    source: "simulator",
    green,
    red: green * 0.6,
    infrared: green * 0.8,
    sampleRateHz: 50,
  };
}

describe("assessPpgQuality", () => {
  it("returns invalid for fewer than 10 samples", () => {
    const result = assessPpgQuality([makeSample(32000)]);
    expect(result.quality).toBe("invalid");
    expect(result.score).toBe(0);
  });

  it("returns good or excellent for clean stable signal", () => {
    const samples = Array.from({ length: 50 }, (_, i) =>
      makeSample(32000 + Math.sin(i / 5) * 1000)
    );
    const result = assessPpgQuality(samples);
    expect(["excellent", "good"]).toContain(result.quality);
  });

  it("detects clipping", () => {
    const samples = Array.from({ length: 50 }, () => makeSample(65535));
    const result = assessPpgQuality(samples);
    expect(result.reasons).toContain("Signal clipping detected");
  });
});

describe("assessContactQuality", () => {
  it("returns no_contact for empty input", () => {
    expect(assessContactQuality([])).toBe("no_contact");
  });

  it("returns good for stable accelerometer", () => {
    const magnitudes = Array(20).fill(1.0);
    expect(assessContactQuality(magnitudes)).toBe("good");
  });

  it("returns poor for highly variable accelerometer", () => {
    const magnitudes = [0.1, 3.5, 0.2, 4.1, 0.1, 3.9, 0.3, 4.2, 0.1, 3.8];
    expect(assessContactQuality(magnitudes)).toBe("poor");
  });
});

