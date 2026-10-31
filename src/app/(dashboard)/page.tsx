"use client";

import { useEffect, useState } from "react";
import { MetricReadout } from "@/components/metrics/metric-card";
import { HrTrendChart } from "@/components/charts/hr-trend-chart";
import { HrvTrendChart } from "@/components/charts/hrv-trend-chart";
import {
  generateHistoricalHeartRate,
  generateHistoricalHrvRmssd,
} from "@/lib/simulator/scenarios";
import { computeRecoveryScore, classifyRecovery, recommendDailyStrain } from "@/lib/analytics/recovery";
import { formatBpm, formatPercent, formatDuration } from "@/lib/utils";

interface DashboardSnapshot {
  recoveryScore: number | null;
  restingHr: number | null;
  overnightHrv: number | null;
  sleepMinutes: number | null;
  strain: number | null;
  spO2: number | null;
  respiratoryRate: number | null;
  tempDeviation: number | null;
  hrHistory: { timestamp: number; bpm: number }[];
  hrvHistory: { date: string; rmssd: number }[];
  morningBrief: string;
}

function generateSnapshot(): DashboardSnapshot {
  const rhr = 56;
  const hrv = 62;
  const sleepMinutes = 421;
  const strain = 11.4;
  const spO2 = 97.8;

  const recoveryScore = computeRecoveryScore({
    overnightHrvRmssd: hrv,
    personalHrvBaseline: { mean: 55, sd: 12 },
    restingHr: rhr,
    personalRhrBaseline: { mean: 58, sd: 4 },
    sleepScore: 74,
    previousDayStrain: strain,
    spO2,
  });

  const hrHistory = generateHistoricalHeartRate(
    Date.now() - 24 * 3600000,
    24 * 60,
    "resting"
  );
  const hrvHistory = generateHistoricalHrvRmssd(14, 55);

  const morningBrief = recoveryScore !== null && recoveryScore >= 67
    ? `Overnight HRV of ${hrv} ms RMSSD sits above 14-day baseline (+7 ms). Parasympathetic tone elevated; optimal readiness for cardiovascular load. Resting pulse at ${rhr} bpm.`
    : `Autonomic equilibrium is stable. HRV RMSSD is ${hrv} ms against baseline with ${rhr} bpm resting pulse. Sleep duration was ${formatDuration(sleepMinutes)}. Target moderate strain load today.`;

  return {
    recoveryScore,
    restingHr: rhr,
    overnightHrv: hrv,
    sleepMinutes,
    strain,
    spO2,
    respiratoryRate: 14.2,
    tempDeviation: -0.1,
    hrHistory,
    hrvHistory,
    morningBrief,
  };
}

export default function OverviewPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(generateSnapshot());
  }, []);

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm font-mono">
        INITIALIZING SENSORS...
      </div>
    );
  }

  const recoveryClass = snapshot.recoveryScore
    ? classifyRecovery(snapshot.recoveryScore)
    : "yellow";
  const strainTarget = snapshot.recoveryScore
    ? recommendDailyStrain(snapshot.recoveryScore)
    : { min: 10, max: 14, label: "Moderate" };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Overview
        </h1>
      </div>

      <div className="flex-1 grid grid-rows-2 overflow-hidden min-h-0">
        <div className="golden-ratio-grid border-b border-border-subtle overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Recovery Index
                </span>
                <span className="text-xs font-mono tracking-widest uppercase px-2.5 py-0.5 rounded border border-quality-good/40 text-quality-good">
                  {recoveryClass === "green" ? "Optimal" : recoveryClass === "yellow" ? "Equilibrium" : "Rest Required"}
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-7xl md:text-8xl lg:text-9xl font-display font-normal tracking-tighter text-foreground leading-none">
                  {snapshot.recoveryScore ?? "—"}
                </span>
                <span className="text-xl font-mono text-muted">/ 100</span>
              </div>

              <div className="text-sm font-mono text-muted mt-2">
                TARGET STRAIN:{" "}
                <span className="text-foreground font-semibold font-numeric">
                  {strainTarget.min}–{strainTarget.max} / 21
                </span>{" "}
                ({strainTarget.label})
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle/80">
              <p className="text-sm text-foreground/85 leading-relaxed font-sans line-clamp-3">
                {snapshot.morningBrief}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle h-full overflow-hidden">
            <MetricReadout
              label="Resting HR"
              value={formatBpm(snapshot.restingHr)}
              unit="bpm"
              trend="down"
              trendValue="-2 bpm vs avg"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Overnight HRV"
              value={snapshot.overnightHrv ?? "—"}
              unit="ms"
              trend="up"
              trendValue="+7 ms RMSSD"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Sleep Duration"
              value={formatDuration(snapshot.sleepMinutes ?? 0)}
              trend="neutral"
              trendValue="Efficiency 82%"
              size="md"
            />
            <MetricReadout
              label="Daily Strain"
              value={snapshot.strain?.toFixed(1) ?? "—"}
              unit="/ 21"
              trend="neutral"
              trendValue="Aerobic 72%"
              size="md"
            />
          </div>
        </div>

        <div className="golden-ratio-grid overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                Heart Rate Telemetry · 24h
              </span>
              <span className="text-xs font-mono text-muted">
                MIN 52 · PEAK 148 BPM
              </span>
            </div>
            <div className="flex-1 w-full min-h-0">
              <HrTrendChart data={snapshot.hrHistory} height="100%" />
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-between overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                HRV Baseline · 14d
              </span>
              <span className="text-xs font-mono text-muted">
                AVG 55 ms
              </span>
            </div>
            <div className="flex-1 w-full min-h-0 mb-4">
              <HrvTrendChart data={snapshot.hrvHistory} baseline={55} height="100%" />
            </div>

            <div className="pt-3 border-t border-border-subtle grid grid-cols-3 divide-x divide-border-subtle text-center shrink-0">
              <div className="px-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted block">SpO₂</span>
                <span className="font-numeric text-base font-medium text-foreground">{formatPercent(snapshot.spO2, 1)}%</span>
              </div>
              <div className="px-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted block">Skin Δ</span>
                <span className="font-numeric text-base font-medium text-foreground">
                  {snapshot.tempDeviation !== null && snapshot.tempDeviation >= 0 ? "+" : ""}{snapshot.tempDeviation?.toFixed(1)}°C
                </span>
              </div>
              <div className="px-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted block">Resp Rate</span>
                <span className="font-numeric text-base font-medium text-foreground">{snapshot.respiratoryRate?.toFixed(1)} brpm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
