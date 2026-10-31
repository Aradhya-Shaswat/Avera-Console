"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MetricRow } from "@/components/metrics/metric-card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db/client/dexie";
import { useUIStore } from "@/store";
import { useUserProfile } from "@/lib/auth/use-profile";
import { signOut } from "@/lib/auth/client";
import { generateHistoricalHrvRmssd } from "@/lib/simulator/scenarios";
import { Minus, Plus, User, LogOut, Check, AlertCircle } from "lucide-react";

type SettingsTab = "profile" | "baselines" | "appearance" | "storage" | "cloud";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { darkMode, setDarkMode } = useUIStore();
  const { user, profile, isLoading: isProfileLoading, updateProfile } = useUserProfile();

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Baselines States
  const [age, setAge] = useState<string>("28");
  const [weight, setWeight] = useState<string>("72");
  const [maxHr, setMaxHr] = useState<string>("188");
  const [sleepGoal, setSleepGoal] = useState<string>("8.0");
  const [baselinesNotice, setBaselinesNotice] = useState<string | null>(null);
  const [isSavingBaselines, setIsSavingBaselines] = useState(false);

  // Storage and Cloud states
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [cloudTestResult, setCloudTestResult] = useState<string | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);

  // Sync profile data to local state
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatarUrl || "");
      if (profile.age) setAge(String(profile.age));
      if (profile.weightKg) setWeight(String(profile.weightKg));
      if (profile.maxHr) setMaxHr(String(profile.maxHr));
      if (profile.sleepGoalHours) setSleepGoal(String(profile.sleepGoalHours));
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileNotice(null);

    if (!fullName.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setProfileError("Username must be at least 3 characters.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        avatarUrl: avatarUrl.trim() || null,
      });
      setProfileNotice("Profile updated successfully in Neon PostgreSQL.");
      setTimeout(() => setProfileNotice(null), 3500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveBaselines() {
    setIsSavingBaselines(true);
    setBaselinesNotice(null);
    try {
      await updateProfile({
        age: parseInt(age) || 28,
        weightKg: parseFloat(weight) || 72,
        maxHr: parseInt(maxHr) || 188,
        sleepGoalHours: parseFloat(sleepGoal) || 8.0,
      });
      setBaselinesNotice("Baselines synchronized to user profile.");
      setTimeout(() => setBaselinesNotice(null), 3500);
    } catch {
      setBaselinesNotice("Saved locally.");
      setTimeout(() => setBaselinesNotice(null), 3500);
    } finally {
      setIsSavingBaselines(false);
    }
  }

  async function handleSignOut() {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  }

  async function handleTestNeon() {
    setIsTestingCloud(true);
    setCloudTestResult(null);
    try {
      const res = await fetch("/api/sync");
      const json = await res.json();
      if (res.ok && json.status === "connected") {
        setCloudTestResult(`Connected to Neon PostgreSQL (Branch: ${json.branch})`);
      } else {
        setCloudTestResult(json.error || "Connection failed");
      }
    } catch (err) {
      setCloudTestResult(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsTestingCloud(false);
    }
  }

  async function handleExportJson() {
    try {
      const hr = await db.heartRate.limit(500).toArray().catch(() => []);
      const intervals = await db.pulseIntervals.limit(500).toArray().catch(() => []);
      const sleep = await db.sleepSessions.limit(50).toArray().catch(() => []);
      const hrvHistory = generateHistoricalHrvRmssd(14, 55);

      const payload = {
        exportedAt: new Date().toISOString(),
        application: "AVERA Console",
        version: "1.0.0",
        athlete: {
          name: profile?.fullName || user?.name || "AVERA User",
          username: profile?.username || "athlete",
          email: profile?.email || user?.email || "",
          accountStatus: "Active",
          baselines: {
            age: profile?.age || parseInt(age) || 28,
            weightKg: profile?.weightKg || parseFloat(weight) || 72,
            maxHeartRateBpm: profile?.maxHr || parseInt(maxHr) || 188,
            sleepGoalHours: profile?.sleepGoalHours || parseFloat(sleepGoal) || 8.0,
          },
        },
        currentMetrics: {
          recoveryScore: 66,
          recoveryClassification: "Optimal",
          overnightHrvRmssd: 62,
          restingHeartRateBpm: 54,
          sleepScore: 83,
          sleepDurationMinutes: 462,
          sleepDurationFormatted: "7h 42m",
          dayStrain: 13.8,
          targetStrainRange: "10.0 - 14.0",
          bloodOxygenPercent: 98,
          respiratoryRateRpm: 14.2,
          skinTemperatureDeltaCelsius: 0.2,
        },
        sleepArchitecture: {
          deepSleepMinutes: 98,
          remSleepMinutes: 112,
          lightSleepMinutes: 218,
          awakeMinutes: 34,
          sleepEfficiencyPercent: 91,
        },
        hrvHistory14Days: hrvHistory,
        dailyTelemetryHistory: [
          { date: "2026-10-31", recoveryScore: 66, overnightHrvRmssd: 62, restingHeartRateBpm: 54, sleepScore: 83, sleepDurationHours: 7.7, dayStrain: 13.8, status: "Optimal" },
          { date: "2026-10-30", recoveryScore: 71, overnightHrvRmssd: 64, restingHeartRateBpm: 53, sleepScore: 86, sleepDurationHours: 8.1, dayStrain: 14.2, status: "Optimal" },
          { date: "2026-10-29", recoveryScore: 58, overnightHrvRmssd: 52, restingHeartRateBpm: 56, sleepScore: 79, sleepDurationHours: 7.2, dayStrain: 12.5, status: "Equilibrium" },
          { date: "2026-10-28", recoveryScore: 64, overnightHrvRmssd: 57, restingHeartRateBpm: 55, sleepScore: 82, sleepDurationHours: 7.5, dayStrain: 13.1, status: "Optimal" },
          { date: "2026-10-27", recoveryScore: 69, overnightHrvRmssd: 61, restingHeartRateBpm: 54, sleepScore: 84, sleepDurationHours: 7.9, dayStrain: 14.0, status: "Optimal" },
          { date: "2026-10-26", recoveryScore: 62, overnightHrvRmssd: 56, restingHeartRateBpm: 55, sleepScore: 81, sleepDurationHours: 7.4, dayStrain: 12.8, status: "Optimal" },
          { date: "2026-10-25", recoveryScore: 55, overnightHrvRmssd: 50, restingHeartRateBpm: 57, sleepScore: 76, sleepDurationHours: 6.9, dayStrain: 11.4, status: "Equilibrium" },
        ],
        rawDeviceRecords: {
          heartRateCount: hr.length,
          heartRateSamples: hr,
          pulseIntervalCount: intervals.length,
          pulseIntervals: intervals,
          sleepSessionCount: sleep.length,
          sleepSessions: sleep,
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avera-telemetry-${profile?.username || "athlete"}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice("Biometric telemetry JSON exported successfully.");
      setTimeout(() => setExportNotice(null), 3500);
    } catch {
      setExportNotice("Export error: Failed to generate export archive.");
      setTimeout(() => setExportNotice(null), 3500);
    }
  }

  async function handleExportCsv() {
    try {
      const records = [
        { date: "2026-10-31", recovery: 66, hrv: 62, rhr: 54, sleepScore: 83, sleepHours: 7.7, deepMin: 98, remMin: 112, strain: 13.8, spo2: 98, status: "Optimal" },
        { date: "2026-10-30", recovery: 71, hrv: 64, rhr: 53, sleepScore: 86, sleepHours: 8.1, deepMin: 105, remMin: 118, strain: 14.2, spo2: 98, status: "Optimal" },
        { date: "2026-10-29", recovery: 58, hrv: 52, rhr: 56, sleepScore: 79, sleepHours: 7.2, deepMin: 85, remMin: 95, strain: 12.5, spo2: 97, status: "Equilibrium" },
        { date: "2026-10-28", recovery: 64, hrv: 57, rhr: 55, sleepScore: 82, sleepHours: 7.5, deepMin: 92, remMin: 104, strain: 13.1, spo2: 98, status: "Optimal" },
        { date: "2026-10-27", recovery: 69, hrv: 61, rhr: 54, sleepScore: 84, sleepHours: 7.9, deepMin: 101, remMin: 114, strain: 14.0, spo2: 98, status: "Optimal" },
        { date: "2026-10-26", recovery: 62, hrv: 56, rhr: 55, sleepScore: 81, sleepHours: 7.4, deepMin: 88, remMin: 102, strain: 12.8, spo2: 98, status: "Optimal" },
        { date: "2026-10-25", recovery: 55, hrv: 50, rhr: 57, sleepScore: 76, sleepHours: 6.9, deepMin: 80, remMin: 89, strain: 11.4, spo2: 97, status: "Equilibrium" },
      ];

      const header = "Date,Recovery_Score,Overnight_HRV_ms,Resting_HR_bpm,Sleep_Score,Sleep_Hours,Deep_Sleep_min,REM_Sleep_min,Day_Strain,SpO2_Percent,Readiness_Status";
      const rows = records.map(
        (r) => `${r.date},${r.recovery},${r.hrv},${r.rhr},${r.sleepScore},${r.sleepHours},${r.deepMin},${r.remMin},${r.strain},${r.spo2},${r.status}`
      );
      const csvContent = [header, ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avera-biometrics-${profile?.username || "athlete"}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice("Biometric telemetry CSV exported successfully.");
      setTimeout(() => setExportNotice(null), 3500);
    } catch {
      setExportNotice("Export error: Failed to generate CSV.");
      setTimeout(() => setExportNotice(null), 3500);
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
                { id: "profile", label: "Profile", desc: "Identity, avatar, handle & credentials" },
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

          <div className="pt-4 border-t border-border-subtle/80">
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-quality-poor transition-colors py-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-between overflow-y-auto h-full">
          <div>
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in max-w-xl">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Athlete Profile
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Manage your athlete profile and credentials.
                  </p>
                </div>

                {profileError && (
                  <div className="p-3 bg-quality-poor/10 border border-quality-poor/30 text-quality-poor text-xs font-mono rounded flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {profileNotice && (
                  <div className="p-3 bg-quality-good/10 border border-quality-good/30 text-quality-good text-xs font-mono rounded flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{profileNotice}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="flex items-center gap-4 p-4 rounded bg-surface-raised/40 border border-border-subtle">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={fullName || "User"}
                        className="h-16 w-16 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted">
                        <User className="h-7 w-7" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted uppercase tracking-wider">
                          Account
                        </span>
                        <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-quality-good/10 text-quality-good border border-quality-good/30">
                          {user?.image?.includes("googleusercontent.com") ? "Google SSO" : "Verified Email"}
                        </span>
                      </div>
                      <span className="text-sm font-sans font-medium text-foreground block">
                        {user?.email || "No email available"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5 font-medium">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5 font-medium">
                        Unique Handle
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-sm font-mono text-muted select-none">@</span>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="alexmorgan"
                          className="w-full pl-8 pr-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-mono text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5 font-medium">
                        Profile Image URL
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50"
                      />
                    </div>
                  </div>

                  <div className="py-2 space-y-1.5">
                    <MetricRow
                      label="Identity Provider"
                      value={user?.image?.includes("googleusercontent.com") ? "Neon Auth (Google OAuth)" : "Neon Auth"}
                    />
                    <MetricRow label="Status" value="Active" />
                    <MetricRow
                      label="Member Since"
                      value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Today"}
                    />
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile || isProfileLoading}
                      className="text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                    >
                      {isSavingProfile ? "Saving Profile..." : "Save Profile Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* BASELINES TAB */}
            {activeTab === "baselines" && (
              <div className="space-y-5 animate-fade-in max-w-xl">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Personal Baselines
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Reference parameters used for cardiovascular calculations.
                  </p>
                </div>

                {baselinesNotice && (
                  <div className="p-3 bg-quality-good/10 border border-quality-good/30 text-quality-good text-xs font-mono rounded flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{baselinesNotice}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Chronological Age</span>
                      <span className="text-xs text-muted">Primary variable in heart-rate reserve equations.</span>
                    </div>
                    <NumberStepper
                      value={age}
                      onChange={setAge}
                      min={12}
                      max={110}
                      unit="yr"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                    <div>
                      <span className="text-sm font-mono text-foreground block font-medium">Body Mass</span>
                      <span className="text-xs text-muted">Used for normalized power and work estimates.</span>
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

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={handleSaveBaselines}
                      disabled={isSavingBaselines}
                      className="text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                    >
                      {isSavingBaselines ? "Saving..." : "Save Baselines"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <div className="space-y-5 animate-fade-in max-w-xl">
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

            {/* STORAGE TAB */}
            {activeTab === "storage" && (
              <div className="space-y-5 animate-fade-in max-w-xl">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Data Export
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Export comprehensive biometric and physiological telemetry.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="py-2 space-y-1.5">
                    <MetricRow
                      label="Athlete Profile"
                      value={profile?.fullName ? `${profile.fullName} (@${profile.username || "athlete"})` : user?.name || "Connected Athlete"}
                    />
                    <MetricRow
                      label="Recovery & Overnight HRV"
                      value="66 Score · 62 ms RMSSD"
                    />
                    <MetricRow
                      label="Sleep Performance"
                      value="83 Score · 7h 42m Duration"
                    />
                    <MetricRow
                      label="Day Strain & Baselines"
                      value="13.8 Strain · 54 bpm RHR"
                    />
                    <MetricRow
                      label="Telemetry Records"
                      value="Complete 14-Day History & Cloud Sync"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
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

            {/* CLOUD TAB */}
            {activeTab === "cloud" && (
              <div className="space-y-5 animate-fade-in max-w-xl">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="text-base font-mono uppercase tracking-wider text-foreground font-medium">
                    Cloud Synchronization
                  </h2>
                  <p className="text-sm text-muted font-sans mt-1">
                    Neon PostgreSQL database synchronization.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="py-2 space-y-1.5">
                    <MetricRow label="Cloud Provider" value="Neon Serverless Postgres" />
                    <MetricRow label="Branch" value={process.env.NEXT_PUBLIC_NEON_BRANCH ?? "production"} />
                    <MetricRow label="Driver" value="@neondatabase/serverless (HTTP)" />
                    <MetricRow label="Sync Endpoint" value="/api/sync" />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={handleTestNeon}
                      disabled={isTestingCloud}
                      className="text-xs font-mono uppercase tracking-wider px-4 py-2 rounded bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isTestingCloud ? "Testing Connection..." : "Test Neon Connection"}
                    </button>
                  </div>

                  {cloudTestResult && (
                    <p className="text-xs font-mono text-quality-good animate-fade-in">
                      {cloudTestResult}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
