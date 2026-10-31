import Dexie, { type Table } from "dexie";
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
import { SCHEMA_V1, type DeviceMetadata, type UserPreferences } from "./schema";

class AevraDatabase extends Dexie {
  heartRate!: Table<HeartRateRecord>;
  pulseIntervals!: Table<PulseIntervalRecord>;
  ppgSamples!: Table<PpgSample>;
  imuSamples!: Table<ImuSample>;
  spO2!: Table<SpO2Record>;
  temperature!: Table<TemperatureRecord>;
  respiratoryRate!: Table<RespiratoryRateRecord>;
  sleepSessions!: Table<SleepSession>;
  activitySessions!: Table<ActivitySession>;
  dailySummaries!: Table<DailySummary>;
  deviceMetadata!: Table<DeviceMetadata>;
  syncQueue!: Table<SyncRecord>;
  preferences!: Table<UserPreferences>;

  constructor() {
    super("aevra-studio");
    this.version(1).stores(SCHEMA_V1);
  }
}

export const db = new AevraDatabase();
export type { DeviceMetadata, UserPreferences };
