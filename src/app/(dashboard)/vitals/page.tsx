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
        <div className="golden-ratio-grid border-b border-border-subtle overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                  Current Heart Rate
                </span>
                <span className="text-xs font-mono tracking-widest uppercase px-2.5 py-0.5 rounded border border-quality-good/40 text-quality-good">
                  Resting Rhythm
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-7xl md:text-8xl lg:text-9xl font-display font-normal tracking-tighter text-foreground leading-none">
                  {formatBpm(64)}
                </span>
                <span className="text-xl font-mono text-muted">bpm</span>
              </div>

              <div className="text-sm font-mono text-muted mt-2">
                RESTING BASELINE:{" "}
                <span className="text-foreground font-semibold font-numeric">
                  56 bpm
                </span>{" "}
                · Signal Confidence 98%
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle/80">
              <p className="text-sm text-foreground/85 leading-relaxed font-sans">
                Optical photoplethysmography streaming continuously. Autonomic tone remains balanced with zero ectopic beat anomalies detected.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle h-full overflow-hidden">
            <MetricReadout
              label="HRV (RMSSD)"
              value={62}
              unit="ms"
              trend="up"
              trendValue="+7 ms baseline"
              quality="good"
              isEstimate
              size="md"
            />
            <MetricReadout
              label="Blood Oxygen (SpO₂)"
              value={formatPercent(97.8, 1)}
              unit="%"
              trend="neutral"
              trendValue="Optimal range"
              quality="good"
              isEstimate
              size="md"
            />
            <MetricReadout
              label="Respiratory Rate"
              value="14.2"
              unit="brpm"
              trend="neutral"
              trendValue="Steady eupnea"
              quality="fair"
              isEstimate
              size="md"
            />
            <MetricReadout
              label="Skin Temperature"
              value="36.6"
              unit="°C"
              trend="neutral"
              trendValue="-0.1°C deviation"
              quality="fair"
              isEstimate
              size="md"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-between overflow-hidden h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
              Continuous Pulse History · Last 12h
            </span>
            <span className="text-xs font-mono text-muted">
              MIN 52 · PEAK 148 BPM
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
