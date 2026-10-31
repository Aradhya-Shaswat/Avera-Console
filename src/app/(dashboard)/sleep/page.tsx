"use client";

import { MetricReadout, MetricRow } from "@/components/metrics/metric-card";
import { computeSleepScore, computeSleepEfficiency } from "@/lib/analytics/sleep";
import { formatDuration, generateId } from "@/lib/utils";
import type { SleepSession } from "@/lib/contracts/sleep";

const mockSession: SleepSession = {
  id: generateId(),
  deviceId: "sim-aevra-001",
  source: "simulator",
  startMs: Date.now() - 8.5 * 3600000,
  endMs: Date.now() - 1.5 * 3600000,
  durationMinutes: 421,
  inBedMinutes: 480,
  awakeMinutes: 28,
  lightMinutes: 192,
  deepMinutes: 89,
  remMinutes: 112,
  cycles: 5,
  stages: [],
  avgHrDuringSleep: 52,
  avgHrvDuringSleep: 68,
  respiratoryDisturbanceIndex: 1.2,
  isEstimate: true,
  algorithmVersion: "1.0.0",
};

const sleepScore = computeSleepScore(mockSession);
const efficiency = computeSleepEfficiency(mockSession);
const totalSleep = mockSession.lightMinutes + mockSession.deepMinutes + mockSession.remMinutes;

const stages = [
  { label: "Awake", minutes: mockSession.awakeMinutes, color: "bg-quality-poor", fraction: mockSession.awakeMinutes / mockSession.inBedMinutes },
  { label: "Light", minutes: mockSession.lightMinutes, color: "bg-metric-hrv/60", fraction: mockSession.lightMinutes / mockSession.inBedMinutes },
  { label: "Deep", minutes: mockSession.deepMinutes, color: "bg-metric-sleep", fraction: mockSession.deepMinutes / mockSession.inBedMinutes },
  { label: "REM", minutes: mockSession.remMinutes, color: "bg-metric-spo2/80", fraction: mockSession.remMinutes / mockSession.inBedMinutes },
];

export default function SleepPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Sleep
        </h1>
      </div>

      <div className="flex-1 grid grid-rows-2 overflow-hidden min-h-0">
        <div className="golden-ratio-grid border-b border-border-subtle overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Sleep Score
                </span>
                <span className="text-xs font-mono tracking-widest uppercase px-2.5 py-0.5 rounded border border-quality-good/40 text-quality-good">
                  {sleepScore && sleepScore >= 80 ? "Optimal Rest" : "Moderate Rest"}
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-7xl md:text-8xl lg:text-9xl font-display font-normal tracking-tighter text-foreground leading-none">
                  {sleepScore ?? "—"}
                </span>
                <span className="text-xl font-mono text-muted">/ 100</span>
              </div>

              <div className="text-sm font-mono text-muted mt-2">
                TIME ASLEEP:{" "}
                <span className="text-foreground font-semibold font-numeric">
                  {formatDuration(totalSleep)}
                </span>{" "}
                (Target 8h 00m) · {mockSession.cycles} Cycles
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle/80">
              <p className="text-sm text-foreground/85 leading-relaxed font-sans">
                Restorative sleep reached 42% of nocturnal duration (Deep {formatDuration(mockSession.deepMinutes)} + REM {formatDuration(mockSession.remMinutes)}). Sleep efficiency maintained at {efficiency?.toFixed(0)}%.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle h-full overflow-hidden">
            <MetricReadout
              label="Time Asleep"
              value={formatDuration(totalSleep)}
              trend="up"
              trendValue="88% in bed"
              size="md"
            />
            <MetricReadout
              label="Sleep Efficiency"
              value={efficiency?.toFixed(0) ?? "—"}
              unit="%"
              trend="up"
              trendValue="Optimal > 80%"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Restorative Sleep"
              value={formatDuration(mockSession.deepMinutes + mockSession.remMinutes)}
              trend="neutral"
              trendValue="Deep + REM"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Disturbance Index"
              value={mockSession.respiratoryDisturbanceIndex?.toFixed(1) ?? "—"}
              unit="/ hr"
              trend="neutral"
              trendValue="Low frequency"
              quality="good"
              size="md"
            />
          </div>
        </div>

        <div className="golden-ratio-grid overflow-hidden h-full min-h-0">
          <div className="p-6 md:p-8 flex flex-col justify-start overflow-hidden h-full border-b lg:border-b-0 lg:border-r border-border-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Hypnogram Architecture
                </span>
                <span className="text-xs font-mono text-muted">
                  IN BED {formatDuration(mockSession.inBedMinutes)}
                </span>
              </div>

              <div className="flex h-5 rounded-none overflow-hidden gap-1 mb-6 bg-surface-raised/40">
                {stages.map((s) => (
                  <div
                    key={s.label}
                    className={s.color}
                    style={{ width: `${s.fraction * 100}%` }}
                    title={`${s.label}: ${formatDuration(s.minutes)} (${Math.round(s.fraction * 100)}%)`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border-subtle/80">
                {stages.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                      <span className="text-xs font-mono uppercase tracking-wider text-muted font-medium">
                        {s.label}
                      </span>
                    </div>
                    <div className="font-numeric text-xl md:text-2xl font-light text-foreground">
                      {formatDuration(s.minutes)}
                    </div>
                    <div className="text-xs font-mono text-muted">
                      {Math.round(s.fraction * 100)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-start overflow-hidden h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Nocturnal Summary
                </span>
              </div>

              <div className="space-y-1.5">
                <MetricRow label="Heart Rate (Sleep Mean)" value={`${mockSession.avgHrDuringSleep ?? "—"}`} unit="bpm" />
                <MetricRow label="Overnight HRV (RMSSD)" value={`${mockSession.avgHrvDuringSleep ?? "—"}`} unit="ms" />
                <MetricRow label="Respiratory Disturbance" value={mockSession.respiratoryDisturbanceIndex?.toFixed(1) ?? "—"} unit="ev/hr" />
                <MetricRow label="Time in Bed" value={formatDuration(mockSession.inBedMinutes)} />
                <MetricRow label="Estimated Sleep Latency" value="14" unit="min" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
