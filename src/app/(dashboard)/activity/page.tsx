"use client";

import { MetricReadout, MetricRow } from "@/components/metrics/metric-card";
import { computeHrZoneDistribution } from "@/lib/analytics/activity";
import { formatDuration } from "@/lib/utils";

const maxHr = 185;

const activityData = [
  { bpm: 135, durationSeconds: 900 },
  { bpm: 148, durationSeconds: 1200 },
  { bpm: 162, durationSeconds: 600 },
  { bpm: 155, durationSeconds: 900 },
  { bpm: 140, durationSeconds: 600 },
  { bpm: 125, durationSeconds: 300 },
];

const zones = computeHrZoneDistribution(activityData, maxHr);
const totalActivityMinutes = activityData.reduce((s, d) => s + d.durationSeconds / 60, 0);
const strain = 11.4;

const zoneColors = [
  "bg-metric-sleep/60",
  "bg-metric-hrv/80",
  "bg-quality-good",
  "bg-quality-fair",
  "bg-quality-poor",
];

const zoneNames = [
  "Zone 1 · Active Recovery",
  "Zone 2 · Aerobic Base",
  "Zone 3 · Tempo / Glycolytic",
  "Zone 4 · Threshold",
  "Zone 5 · Anaerobic Peak",
];

export default function ActivityPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Activity & Strain
        </h1>
      </div>

      <div className="flex-1 grid grid-rows-2 overflow-hidden min-h-0">
        <div className="golden-ratio-grid border-b border-border-subtle overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Day Strain
                </span>
                <span className="text-xs font-mono tracking-widest uppercase px-2.5 py-0.5 rounded border border-quality-good/40 text-quality-good">
                  Moderate Effort
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-7xl md:text-8xl lg:text-9xl font-display font-normal tracking-tighter text-foreground leading-none">
                  {strain.toFixed(1)}
                </span>
                <span className="text-xl font-mono text-muted">/ 21</span>
              </div>

              <div className="text-sm font-mono text-muted mt-2">
                ACTIVE TIME:{" "}
                <span className="text-foreground font-semibold font-numeric">
                  {formatDuration(totalActivityMinutes)}
                </span>{" "}
                (Target 10–14) · 1 Session
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle/80">
              <p className="text-sm text-foreground/85 leading-relaxed font-sans">
                Cardiovascular load centered primarily in aerobic steady-state (Zone 2–3). Peak exertion peaked at 162 bpm (88% of max capacity).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle h-full overflow-hidden">
            <MetricReadout
              label="Active Time"
              value={formatDuration(totalActivityMinutes)}
              trend="up"
              trendValue="1 session"
              size="md"
            />
            <MetricReadout
              label="Peak Pulse"
              value={Math.max(...activityData.map((d) => d.bpm))}
              unit="bpm"
              trend="neutral"
              trendValue="88% Max HR"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Mean Pulse"
              value={Math.round(activityData.reduce((s, d) => s + d.bpm * d.durationSeconds, 0) / activityData.reduce((s, d) => s + d.durationSeconds, 0))}
              unit="bpm"
              trend="neutral"
              trendValue="Aerobic steady-state"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Estimated Energy"
              value="2,140"
              unit="kJ"
              trend="up"
              trendValue="511 kcal"
              size="md"
            />
          </div>
        </div>

        <div className="golden-ratio-grid overflow-hidden h-full min-h-0">
          <div className="p-6 md:p-8 flex flex-col justify-start overflow-hidden h-full border-b lg:border-b-0 lg:border-r border-border-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Heart Rate Zones
                </span>
                <span className="text-xs font-mono text-muted">
                  MAX {maxHr} BPM
                </span>
              </div>

              <div className="flex h-5 rounded-none overflow-hidden gap-1 mb-5 bg-surface-raised/40">
                {zones.map((z, i) => {
                  const fraction = z.durationMinutes / totalActivityMinutes;
                  return (
                    <div
                      key={z.zone}
                      className={zoneColors[i]}
                      style={{ width: `${fraction * 100}%` }}
                      title={`Zone ${z.zone}: ${z.durationMinutes.toFixed(1)} min`}
                    />
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                {zones.map((z, i) => (
                  <div key={z.zone} className="flex items-center justify-between text-sm font-mono py-1.5 border-b border-border-subtle/50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${zoneColors[i]}`} />
                      <span className="text-foreground">{zoneNames[i]}</span>
                    </div>
                    <div className="flex items-center gap-5 text-muted">
                      <span>{z.minBpm}–{z.maxBpm} bpm</span>
                      <span className="font-numeric text-foreground font-medium w-14 text-right">
                        {z.durationMinutes.toFixed(0)}m
                      </span>
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
                  Session Telemetry
                </span>
              </div>

              <div className="space-y-1.5">
                <MetricRow label="Classification" value="Steady Outdoor Run" />
                <MetricRow label="Elapsed Exertion" value={formatDuration(totalActivityMinutes)} />
                <MetricRow label="Accumulated Strain" value={`${strain} / 21`} />
                <MetricRow label="Peak Pulse Velocity" value="162" unit="bpm" />
                <MetricRow label="Estimated Energy" value="2,140" unit="kJ" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
