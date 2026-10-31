"use client";

import { MetricReadout } from "@/components/metrics/metric-card";
import { HrTrendChart } from "@/components/charts/hr-trend-chart";
import { generateHistoricalHeartRate } from "@/lib/simulator/scenarios";
import { formatBpm, formatPercent } from "@/lib/utils";

const hrHistory = generateHistoricalHeartRate(Date.now() - 12 * 3600000, 12 * 60, "resting");

export default function VitalsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Vitals & Biometrics
        </h1>
      </div>

      <div className="flex-1 grid grid-rows-2 overflow-hidden min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border-subtle border-b border-border-subtle overflow-hidden h-full">
          <MetricReadout
            label="Heart Rate"
            value={formatBpm(64)}
            unit="bpm"
            quality="excellent"
            size="md"
          />
          <MetricReadout
            label="HRV (RMSSD)"
            value={62}
            unit="ms"
            quality="good"
            isEstimate
            size="md"
          />
          <MetricReadout
            label="Oxygen Saturation (SpO₂)"
            value={formatPercent(97.8, 1)}
            unit="%"
            quality="good"
            isEstimate
            size="md"
          />
          <MetricReadout
            label="Skin Temperature"
            value="36.6"
            unit="°C"
            quality="fair"
            isEstimate
            size="md"
          />
          <MetricReadout
            label="Respiratory Rate"
            value="14.2"
            unit="brpm"
            quality="fair"
            isEstimate
            size="md"
          />
          <MetricReadout
            label="Temperature Deviation"
            value="-0.1"
            unit="°C"
            trend="neutral"
            trendValue="Baseline 36.7°C"
            isEstimate
            size="md"
          />
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-between overflow-hidden h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
              Continuous Pulse History · Last 12h
            </span>
            <span className="text-xs font-mono text-muted">
              SAMPLING INTERVAL 1 MINUTE
            </span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <HrTrendChart data={hrHistory} height="100%" />
          </div>
        </div>
      </div>
    </div>
  );
}
