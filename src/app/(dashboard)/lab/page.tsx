"use client";

import { useEffect, useRef, useState } from "react";
import { useDeviceStore } from "@/store";
import { deviceManager } from "@/lib/devices/device-manager";
import { assessPpgQuality } from "@/lib/analytics/signal-quality";
import { MetricReadout } from "@/components/metrics/metric-card";
import { cn } from "@/lib/utils";
import type { PpgSample } from "@/lib/contracts/measurement";
import type { DeviceEvent } from "@/lib/devices/adapter";
import type { SimulatorScenario } from "@/lib/simulator/scenarios";

const SCENARIOS: { value: SimulatorScenario; label: string }[] = [
  { value: "resting", label: "Resting" },
  { value: "exercising", label: "Exercising" },
  { value: "motion_artifact", label: "Motion" },
  { value: "poor_contact", label: "Contact" },
  { value: "disconnected", label: "Offline" },
];

const MAX_WAVEFORM_POINTS = 160;

export default function LabPage() {
  const { deviceState, scenario, setScenario } = useDeviceStore();
  const [ppgBuffer, setPpgBuffer] = useState<PpgSample[]>([]);
  const [liveHr, setLiveHr] = useState<number | null>(null);
  const [signalQuality, setSignalQuality] = useState<string>("—");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (deviceState.connectionState !== "connected") return;

    const unsub = deviceManager.addDeviceEventListener((event: DeviceEvent) => {
      if (event.type === "ppg_sample") {
        setPpgBuffer((prev) => {
          const next = [...prev, event.data].slice(-MAX_WAVEFORM_POINTS);
          const assessment = assessPpgQuality(next);
          setSignalQuality(assessment.quality);
          return next;
        });
      }
      if (event.type === "heart_rate") {
        setLiveHr(event.data.bpm);
      }
    });

    return () => unsub?.();
  }, [deviceState.connectionState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(143, 144, 137, 0.12)";
      ctx.lineWidth = 0.5;
      const gridSpacing = 24;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (ppgBuffer.length < 2) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const greenValues = ppgBuffer.map((s) => s.green);
      const min = Math.min(...greenValues);
      const max = Math.max(...greenValues);
      const range = max - min || 1;

      ctx.beginPath();
      ctx.strokeStyle = "#879783";
      ctx.lineWidth = 1.75;

      ppgBuffer.forEach((sample, i) => {
        const x = (i / (MAX_WAVEFORM_POINTS - 1)) * width;
        const y = height - ((sample.green - min) / range) * height * 0.75 - height * 0.12;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [ppgBuffer]);

  function handleScenarioChange(s: SimulatorScenario) {
    setScenario(s);
    const adapter = deviceManager.getAdapter();
    if (adapter && "setScenario" in adapter) {
      (adapter as { setScenario: (s: SimulatorScenario) => void }).setScenario(s);
    }
  }

  const isConnected = deviceState.connectionState === "connected";

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          AVERA Lab
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {SCENARIOS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleScenarioChange(s.value)}
              className={cn(
                "text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded transition-colors",
                scenario === s.value
                  ? "bg-foreground text-background font-medium"
                  : "text-muted hover:text-foreground border border-border-subtle"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-2">
            Oscilloscope Standby
          </p>
          <p className="text-xs text-muted max-w-sm">
            Connect a device or simulator in Devices to begin streaming photoplethysmography telemetry.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 p-6 border-b border-border-subtle flex flex-col justify-between overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-3 text-xs font-mono shrink-0">
              <span className="uppercase tracking-[0.2em] text-muted font-medium">
                PPG Green Channel (525 nm) · 50 Hz ADC
              </span>
              <span className="capitalize font-medium text-foreground">
                QUALITY: {signalQuality}
              </span>
            </div>
            <div className="relative flex-1 w-full border border-border-subtle overflow-hidden bg-surface-raised/20 min-h-[160px]">
              <canvas
                ref={canvasRef}
                width={1400}
                height={260}
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-subtle shrink-0">
            <MetricReadout
              label="Instantaneous Pulse"
              value={liveHr ?? "—"}
              unit="bpm"
              quality="good"
              size="md"
            />
            <MetricReadout
              label="Buffer Occupancy"
              value={ppgBuffer.length}
              unit={`/ ${MAX_WAVEFORM_POINTS}`}
              trend="neutral"
              trendValue="FIFO Ring"
              size="md"
            />
            <MetricReadout
              label="Scenario"
              value={scenario.replace("_", " ")}
              size="md"
              className="capitalize"
            />
            <MetricReadout
              label="Signal State"
              value={signalQuality}
              quality={signalQuality === "excellent" || signalQuality === "good" ? "good" : "fair"}
              size="md"
              className="capitalize"
            />
          </div>
        </div>
      )}
    </div>
  );
}
