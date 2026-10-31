import type { DeviceEvent } from "@/lib/devices/adapter";
import { generateId } from "@/lib/utils";

export type SimulatorScenario =
  | "resting"
  | "exercising"
  | "motion_artifact"
  | "poor_contact"
  | "disconnected";

let _seed = 42;

function seededRandom(): number {
  _seed = (_seed * 9301 + 49297) % 233280;
  return _seed / 233280;
}

function jitter(base: number, range: number): number {
  return base + (seededRandom() - 0.5) * 2 * range;
}

function generatePpgSample(scenario: SimulatorScenario): number {
  const base = 32000;
  const amplitude = scenario === "exercising" ? 4000 : 2000;
  const noise = scenario === "motion_artifact" ? 8000 : 200;
  return base + amplitude * Math.sin(Date.now() / 500) + jitter(0, noise);
}

function generateHeartRate(scenario: SimulatorScenario): number {
  switch (scenario) {
    case "resting":
      return Math.round(jitter(58, 4));
    case "exercising":
      return Math.round(jitter(142, 12));
    case "motion_artifact":
      return Math.round(jitter(75, 20));
    case "poor_contact":
      return Math.round(jitter(65, 30));
    case "disconnected":
      return 0;
  }
}

function generatePulseInterval(bpm: number): number {
  if (bpm <= 0) return 0;
  const base = 60000 / bpm;
  return Math.round(jitter(base, base * 0.04));
}

export function generateSimulatedSession(
  scenario: SimulatorScenario,
  deviceId: string
): DeviceEvent[] {
  if (scenario === "disconnected") return [];

  const now = Date.now();
  const baseRecord = {
    id: generateId(),
    timestamp: now,
    deviceId,
    source: "simulator" as const,
    algorithmVersion: "1.0.0",
  };

  const bpm = generateHeartRate(scenario);
  const intervalMs = generatePulseInterval(bpm);

  const events: DeviceEvent[] = [
    {
      type: "heart_rate",
      data: {
        ...baseRecord,
        id: generateId(),
        bpm,
        quality:
          scenario === "poor_contact"
            ? "poor"
            : scenario === "motion_artifact"
            ? "fair"
            : "good",
        confidence: scenario === "poor_contact" ? 0.4 : 0.92,
      },
    },
    {
      type: "ppg_sample",
      data: {
        ...baseRecord,
        id: generateId(),
        green: generatePpgSample(scenario),
        red: generatePpgSample(scenario) * 0.6,
        infrared: generatePpgSample(scenario) * 0.8,
        sampleRateHz: 50,
      },
    },
    {
      type: "imu_sample",
      data: {
        ...baseRecord,
        id: generateId(),
        accelX: scenario === "motion_artifact" ? jitter(0, 2) : jitter(0, 0.05),
        accelY: scenario === "motion_artifact" ? jitter(0, 2) : jitter(0.98, 0.05),
        accelZ: scenario === "motion_artifact" ? jitter(0, 2) : jitter(0, 0.05),
        sampleRateHz: 50,
      },
    },
  ];

  if (intervalMs > 0) {
    events.push({
      type: "pulse_interval",
      data: {
        ...baseRecord,
        id: generateId(),
        intervalMs,
        rrIntervalMs: intervalMs,
        artifactFlag: scenario === "motion_artifact" && seededRandom() > 0.7,
      },
    });
  }

  if (Math.random() > 0.97) {
    events.push({
      type: "spo2",
      data: {
        ...baseRecord,
        id: generateId(),
        percent: Math.round(jitter(scenario === "poor_contact" ? 96 : 98, 1)),
        isEstimate: true,
        confidence: scenario === "poor_contact" ? 0.5 : 0.88,
      },
    });
  }

  if (Math.random() > 0.98) {
    events.push({
      type: "temperature",
      data: {
        ...baseRecord,
        id: generateId(),
        celsius: Math.round(jitter(36.6, 0.2) * 10) / 10,
        deviationFromBaseline: Math.round(jitter(0, 0.3) * 10) / 10,
        isEstimate: true,
      },
    });
  }

  return events;
}

export function generateHistoricalHeartRate(
  startMs: number,
  durationMinutes: number,
  scenario: SimulatorScenario = "resting"
): { timestamp: number; bpm: number }[] {
  const result: { timestamp: number; bpm: number }[] = [];
  const intervalMs = 60000;
  for (let t = startMs; t < startMs + durationMinutes * 60000; t += intervalMs) {
    result.push({
      timestamp: t,
      bpm: generateHeartRate(scenario),
    });
  }
  return result;
}

export function generateHistoricalHrvRmssd(
  days: number,
  baseRmssd: number = 55
): { date: string; rmssd: number }[] {
  const result: { date: string; rmssd: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    result.push({
      date: date.toISOString().split("T")[0],
      rmssd: Math.max(20, Math.round(jitter(baseRmssd, 12) * 10) / 10),
    });
  }
  return result;
}

