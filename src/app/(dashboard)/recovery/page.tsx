"use client";

import { MetricReadout, MetricRow } from "@/components/metrics/metric-card";
import { HrvTrendChart } from "@/components/charts/hrv-trend-chart";
import { generateHistoricalHrvRmssd } from "@/lib/simulator/scenarios";
import {
  computeRecoveryScore,
  classifyRecovery,
  recommendDailyStrain,
} from "@/lib/analytics/recovery";

const overnightHrv = 62;
const restingHr = 56;
const sleepScore = 74;
const previousStrain = 11.4;

const recoveryScore = computeRecoveryScore({
  overnightHrvRmssd: overnightHrv,
  personalHrvBaseline: { mean: 55, sd: 12 },
  restingHr,
  personalRhrBaseline: { mean: 58, sd: 4 },
  sleepScore,
  previousDayStrain: previousStrain,
  spO2: 97.8,
});

const classification = recoveryScore ? classifyRecovery(recoveryScore) : "yellow";
const recommendation = recoveryScore ? recommendDailyStrain(recoveryScore) : { min: 10, max: 14, label: "Moderate Effort" };
const hrvHistory = generateHistoricalHrvRmssd(14, 55);

export default function RecoveryPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Recovery
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
                  {classification === "green" ? "Optimal Tone" : classification === "yellow" ? "Equilibrium" : "Sympathetic Dominant"}
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-7xl md:text-8xl lg:text-9xl font-display font-normal tracking-tighter text-foreground leading-none">
                  {recoveryScore ?? "—"}
                </span>
                <span className="text-xl font-mono text-muted">/ 100</span>
              </div>

              <p className="text-sm text-foreground/85 leading-relaxed font-sans max-w-xl line-clamp-3 mt-2">
                Autonomic balance supports cardiovascular load. Resting pulse suppression and vagal modulation show high baseline capacity.
              </p>
            </div>

            <div className="pt-4 border-t border-border-subtle/80 flex items-baseline justify-between text-sm font-mono">
              <span className="text-muted uppercase tracking-[0.18em]">Cardiovascular Target</span>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold font-numeric text-foreground text-base">{recommendation.min}–{recommendation.max}</span>
                <span className="text-muted">/ 21 Strain ({recommendation.label})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle h-full overflow-hidden">
            <MetricReadout
              label="Overnight HRV"
              value={overnightHrv}
              unit="ms RMSSD"
              trend="up"
              trendValue="+7 ms vs baseline"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Resting HR"
              value={restingHr}
              unit="bpm"
              trend="down"
              trendValue="-2 bpm suppression"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Sleep Factor"
              value={sleepScore}
              unit="/ 100"
              trend="neutral"
              trendValue="Restorative 82%"
              size="md"
            />
            <MetricReadout
              label="Prior Day Load"
              value={previousStrain.toFixed(1)}
              unit="/ 21"
              trend="neutral"
              trendValue="Metabolic cost"
              size="md"
            />
          </div>
        </div>

        <div className="golden-ratio-grid overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                HRV RMSSD Distribution · 14d
              </span>
              <span className="text-xs font-mono text-muted">
                BASELINE 55 ms
              </span>
            </div>
            <div className="flex-1 w-full min-h-0">
              <HrvTrendChart data={hrvHistory} baseline={55} height="100%" />
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-start overflow-hidden h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Model Weights
                </span>
              </div>

              <div className="space-y-1.5">
                <MetricRow label="HRV RMSSD Delta Weight" value="40%" />
                <MetricRow label="Resting HR Inversion Weight" value="25%" />
                <MetricRow label="Sleep Quality Coefficient" value="25%" />
                <MetricRow label="Prior Metabolic Strain Penalty" value="10%" />
                <MetricRow label="Rolling Baseline Window" value="30" unit="days" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
