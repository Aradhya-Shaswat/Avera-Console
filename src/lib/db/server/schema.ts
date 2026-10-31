import "server-only";
import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const heartRateRecords = pgTable(
  "heart_rate_records",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: text("device_id").notNull(),
    bpm: integer("bpm").notNull(),
    confidence: real("confidence"),
    quality: text("quality"),
    source: text("source").notNull(),
    algorithmVersion: text("algorithm_version"),
    recordedAt: timestamp("recorded_at").notNull(),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
    localVersion: integer("local_version").notNull().default(1),
  },
  (t) => [
    index("hr_user_time_idx").on(t.userId, t.recordedAt),
    index("hr_device_idx").on(t.deviceId),
  ]
);

export const pulseIntervalRecords = pgTable(
  "pulse_interval_records",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: text("device_id").notNull(),
    intervalMs: integer("interval_ms").notNull(),
    rrIntervalMs: integer("rr_interval_ms"),
    artifactFlag: boolean("artifact_flag").default(false).notNull(),
    source: text("source").notNull(),
    algorithmVersion: text("algorithm_version"),
    recordedAt: timestamp("recorded_at").notNull(),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
    localVersion: integer("local_version").notNull().default(1),
  },
  (t) => [index("pi_user_time_idx").on(t.userId, t.recordedAt)]
);

export const sleepSessions = pgTable(
  "sleep_sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: text("device_id").notNull(),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    lightMinutes: integer("light_minutes").notNull(),
    deepMinutes: integer("deep_minutes").notNull(),
    remMinutes: integer("rem_minutes").notNull(),
    awakeMinutes: integer("awake_minutes").notNull(),
    stages: jsonb("stages"),
    source: text("source").notNull(),
    isEstimate: boolean("is_estimate").default(false).notNull(),
    algorithmVersion: text("algorithm_version"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
    localVersion: integer("local_version").notNull().default(1),
  },
  (t) => [index("sleep_user_time_idx").on(t.userId, t.startAt)]
);

export const activitySessions = pgTable(
  "activity_sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: text("device_id").notNull(),
    type: text("type").notNull(),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    strain: real("strain").notNull(),
    avgHr: integer("avg_hr"),
    maxHr: integer("max_hr"),
    hrZones: jsonb("hr_zones"),
    source: text("source").notNull(),
    algorithmVersion: text("algorithm_version"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
    localVersion: integer("local_version").notNull().default(1),
  },
  (t) => [index("activity_user_time_idx").on(t.userId, t.startAt)]
);

export const dailySummaries = pgTable(
  "daily_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: text("device_id").notNull(),
    date: text("date").notNull(),
    recoveryScore: integer("recovery_score"),
    strain: real("strain"),
    restingHr: integer("resting_hr"),
    overnightHrv: real("overnight_hrv"),
    sleepDurationMinutes: integer("sleep_duration_minutes"),
    avgSpO2: real("avg_spo2"),
    avgTemperatureDeviation: real("avg_temperature_deviation"),
    avgRespiratoryRate: real("avg_respiratory_rate"),
    algorithmVersion: text("algorithm_version"),
    generatedAt: timestamp("generated_at").notNull(),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (t) => [
    index("summary_user_date_idx").on(t.userId, t.date),
  ]
);

