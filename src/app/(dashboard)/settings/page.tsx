"use client";

import { useState } from "react";
import { MetricRow } from "@/components/metrics/metric-card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db/client/dexie";
import { useUIStore } from "@/store";
import { Minus, Plus } from "lucide-react";

type SettingsTab = "baselines" | "appearance" | "storage" | "cloud";

interface NumberStepperProps {
  value: string;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function NumberStepper({ value, onChange, min = 1, max, step = 1, unit }: NumberStepperProps) {
  function handleDecrement() {
    const num = parseFloat(value) || 0;
    const next = step < 1 ? +(num - step).toFixed(1) : num - step;
    if (min === undefined || next >= min) {
      onChange(step < 1 ? next.toFixed(1) : String(next));
    }
  }

  function handleIncrement() {
    const num = parseFloat(value) || 0;
    const next = step < 1 ? +(num + step).toFixed(1) : num + step;
    if (max === undefined || next <= max) {
      onChange(step < 1 ? next.toFixed(1) : String(next));
    }
  }

  return (
    <div className="flex items-center border border-border rounded overflow-hidden bg-surface-raised/40 hover:border-foreground/30 transition-colors">
      <button
        type="button"
        onClick={handleDecrement}
        className="px-2.5 py-1.5 text-muted hover:text-foreground hover:bg-surface-raised transition-colors flex items-center justify-center select-none"
        aria-label="Decrease"
      >
        <Minus className="h-3 w-3" />
      </button>

      <div className="flex items-center justify-center min-w-[3.5rem] px-1 border-x border-border/50">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^\d*\.?\d*$/.test(val)) {
              onChange(val);
            }
          }}
          className="w-11 text-center bg-transparent text-sm font-mono font-numeric text-foreground focus:outline-none"
        />
        {unit && <span className="text-[11px] font-mono text-muted pr-1">{unit}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        className="px-2.5 py-1.5 text-muted hover:text-foreground hover:bg-surface-raised transition-colors flex items-center justify-center select-none"
        aria-label="Increase"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("baselines");
  const { darkMode, setDarkMode } = useUIStore();
  const [age, setAge] = useState<string>("28");
  const [weight, setWeight] = useState<string>("72");
  const [maxHr, setMaxHr] = useState<string>("188");
  const [sleepGoal, setSleepGoal] = useState<string>("8.0");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  async function handleExportJson() {
    try {
      const hr = await db.heartRate.limit(500).toArray();
      const intervals = await db.pulseIntervals.limit(500).toArray();
      const sleep = await db.sleepSessions.limit(50).toArray();
      const payload = {
        exportedAt: new Date().toISOString(),
        application: "AVERA Console",
        version: "1.0.0",
        heartRate: hr,
        pulseIntervals: intervals,
        sleepSessions: sleep,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avera-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice("JSON export generated successfully.");
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice("Export error: IndexedDB storage is empty or unavailable.");
      setTimeout(() => setExportNotice(null), 3000);
    }
  }

  async function handleExportCsv() {
    try {
      const hr = await db.heartRate.limit(500).toArray();
      const rows = [
        "id,timestamp,deviceId,bpm,quality,source",
        ...hr.map((r) => `${r.id},${r.timestamp},${r.deviceId},${r.bpm},${r.quality ?? ""},${r.source}`),
      ];
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avera-telemetry-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice("CSV export generated successfully.");
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice("Export error: IndexedDB storage is empty or unavailable.");
      setTimeout(() => setExportNotice(null), 3000);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Settings
        </h1>
      </div>

      <div className="flex-1 golden-ratio-grid overflow-hidden min-h-0">
        <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col justify-between overflow-hidden h-full">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted block mb-5 font-medium">
              Configuration
            </span>

            <nav className="space-y-2">
              {[
                { id: "baselines", label: "Baselines", desc: "Age, weight, max HR, target sleep" },
                { id: "appearance", label: "Appearance", desc: "Light and dark color themes" },
                { id: "storage", label: "Data & Export", desc: "Download JSON or CSV records" },
                { id: "cloud", label: "Cloud Sync", desc: "PostgreSQL database synchronization" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    "w-full text-left p-3.5 rounded transition-colors block",
                    activeTab === tab.id
                      ? "bg-surface-raised/70 border-l-2 border-foreground"
                      : "hover:bg-surface-raised/30 text-muted"
                  )}
                >
                  <span className={cn(
                    "block text-sm font-mono uppercase tracking-wide",
                    activeTab === tab.id ? "text-foreground font-medium" : "text-muted"
                  )}>
                    {tab.label}
                  </span>
                  <span className="block text-xs text-muted/80 font-sans mt-0.5">
                    {tab.desc}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-between overflow-hidden h-full">
          <div className="overflow-hidden">
            {activeTab === "baselines" && (
              <div className="space-y-5">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Personal Baselines
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Reference parameters used for cardiovascular calculations.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Age</span>
                      <span className="text-xs text-muted">Used for maximum heart rate estimation.</span>
                    </div>
                    <NumberStepper
                      value={age}
                      onChange={setAge}
                      min={12}
                      max={120}
                      unit="yr"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Body Mass</span>
                      <span className="text-xs text-muted">Used for energy expenditure estimations.</span>
                    </div>
                    <NumberStepper
                      value={weight}
                      onChange={setWeight}
                      min={30}
                      max={300}
                      unit="kg"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Max Heart Rate</span>
                      <span className="text-xs text-muted">Ceiling reference for strain zone limits.</span>
                    </div>
                    <NumberStepper
                      value={maxHr}
                      onChange={setMaxHr}
                      min={100}
                      max={240}
                      unit="bpm"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Sleep Goal</span>
                      <span className="text-xs text-muted">Nightly restorative sleep target.</span>
                    </div>
                    <NumberStepper
                      value={sleepGoal}
                      onChange={setSleepGoal}
                      min={4.0}
                      max={14.0}
                      step={0.5}
                      unit="h"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-5">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Appearance
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Interface color theme.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Color Theme</span>
                      <span className="text-xs text-muted">Bone Light or Deep Graphite.</span>
                    </div>
                    <div className="flex items-center gap-1.5 border border-border p-1 rounded">
                      <button
                        onClick={() => {
                          setDarkMode(false);
                          document.documentElement.classList.remove("dark");
                        }}
                        className={cn(
                          "px-4 py-1.5 text-xs font-mono transition-colors",
                          !darkMode ? "bg-foreground text-background font-medium" : "text-muted hover:text-foreground"
                        )}
                      >
                        Bone
                      </button>
                      <button
                        onClick={() => {
                          setDarkMode(true);
                          document.documentElement.classList.add("dark");
                        }}
                        className={cn(
                          "px-4 py-1.5 text-xs font-mono transition-colors",
                          darkMode ? "bg-foreground text-background font-medium" : "text-muted hover:text-foreground"
                        )}
                      >
                        Graphite
                      </button>
                    </div>
                  </div>

                  <div className="py-2 space-y-1.5">
                    <MetricRow label="Headings Typography" value="Libre Caslon Display" />
                    <MetricRow label="Numerical Engine" value="Geist Sans (Tabular Lining)" />
                    <MetricRow label="Layout Grid" value="Golden Ratio (1.618 : 1)" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "storage" && (
              <div className="space-y-5">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Data Export
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Export local biometric telemetry.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="py-2 space-y-1.5">
                    <MetricRow label="Storage Engine" value="IndexedDB" />
                    <MetricRow label="Location" value="Local Browser" />
                  </div>

                  <div className="pt-4 border-t border-border-subtle flex items-center gap-3">
                    <button
                      onClick={handleExportJson}
                      className="text-xs font-mono uppercase tracking-wider px-4 py-2 rounded bg-foreground text-background hover:opacity-90 transition-opacity"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="text-xs font-mono uppercase tracking-wider px-4 py-2 rounded border border-border hover:border-foreground transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>

                  {exportNotice && (
                    <p className="text-xs font-mono text-quality-good animate-fade-in">
                      {exportNotice}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "cloud" && (
              <div className="space-y-5">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Cloud Synchronization
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    PostgreSQL database synchronization.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="py-2 space-y-1.5">
                    <MetricRow label="Sync State" value="Disabled (Local-Only)" />
                    <MetricRow label="Endpoint" value="POST /api/sync" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
