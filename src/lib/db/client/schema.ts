import type {
  HeartRateRecord,
  PulseIntervalRecord,
  PpgSample,
  ImuSample,
  SpO2Record,
  TemperatureRecord,
  RespiratoryRateRecord,
  DailySummary,
} from "@/lib/contracts/measurement";
import type { SleepSession } from "@/lib/contracts/sleep";
import type { ActivitySession } from "@/lib/contracts/activity";
import type { SyncRecord } from "@/lib/contracts/sync";
import type { DeviceInfo, BatteryStatus } from "@/lib/contracts/device";

export interface DeviceMetadata {
  id: string;
  info: DeviceInfo;
  battery: BatteryStatus | null;
  lastSeenAt: number;
  isSimulated: boolean;
}

export interface UserPreferences {
  id: "singleton";
  theme: "light" | "dark" | "system";
  cloudSyncEnabled: boolean;
  maxHr: number | null;
  ageYears: number | null;
  weightKg: number | null;
  sleepGoalMinutes: number;
  exportFormat: "csv" | "json";
}

export const SCHEMA_V1 = {
  heartRate: "id, timestamp, deviceId, source",
  pulseIntervals: "id, timestamp, deviceId, source",
  ppgSamples: "id, timestamp, deviceId",
  imuSamples: "id, timestamp, deviceId",
  spO2: "id, timestamp, deviceId",
  temperature: "id, timestamp, deviceId",
  respiratoryRate: "id, timestamp, deviceId",
  sleepSessions: "id, startMs, deviceId",
  activitySessions: "id, startMs, deviceId, type",
  dailySummaries: "[date+deviceId], date, deviceId",
  deviceMetadata: "id",
  syncQueue: "id, entityType, entityId, status, createdAt",
  preferences: "id",
};

