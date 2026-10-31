import { z } from "zod";

export type DataSource = "simulator" | "ble" | "manual" | "imported";
export type SignalQuality = "excellent" | "good" | "fair" | "poor" | "invalid";
export type AlgorithmVersion = string;

export const SignalQualitySchema = z.enum([
  "excellent",
  "good",
  "fair",
  "poor",
  "invalid",
]);

export const BaseRecordSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  deviceId: z.string(),
  source: z.enum(["simulator", "ble", "manual", "imported"]),
  algorithmVersion: z.string().optional(),
  quality: SignalQualitySchema.optional(),
});

export type BaseRecord = z.infer<typeof BaseRecordSchema>;

export const HeartRateRecordSchema = BaseRecordSchema.extend({
  bpm: z.number().min(20).max(300),
  confidence: z.number().min(0).max(1).optional(),
});

export type HeartRateRecord = z.infer<typeof HeartRateRecordSchema>;

export const PulseIntervalRecordSchema = BaseRecordSchema.extend({
  intervalMs: z.number().min(200).max(3000),
  rrIntervalMs: z.number().min(200).max(3000).optional(),
  artifactFlag: z.boolean().default(false),
});

export type PulseIntervalRecord = z.infer<typeof PulseIntervalRecordSchema>;

export const PpgSampleSchema = BaseRecordSchema.extend({
  green: z.number(),
  red: z.number().optional(),
  infrared: z.number().optional(),
  sampleRateHz: z.number(),
});

export type PpgSample = z.infer<typeof PpgSampleSchema>;

export const ImuSampleSchema = BaseRecordSchema.extend({
  accelX: z.number(),
  accelY: z.number(),
  accelZ: z.number(),
  gyroX: z.number().optional(),
  gyroY: z.number().optional(),
  gyroZ: z.number().optional(),
  sampleRateHz: z.number(),
});

export type ImuSample = z.infer<typeof ImuSampleSchema>;

export const SpO2RecordSchema = BaseRecordSchema.extend({
  percent: z.number().min(70).max(100),
  confidence: z.number().min(0).max(1).optional(),
  isEstimate: z.boolean().default(true),
});

export type SpO2Record = z.infer<typeof SpO2RecordSchema>;

export const TemperatureRecordSchema = BaseRecordSchema.extend({
  celsius: z.number().min(30).max(45),
  deviationFromBaseline: z.number().optional(),
  isEstimate: z.boolean().default(true),
});

export type TemperatureRecord = z.infer<typeof TemperatureRecordSchema>;

export const RespiratoryRateRecordSchema = BaseRecordSchema.extend({
  breathsPerMinute: z.number().min(4).max(60),
  isEstimate: z.boolean().default(true),
});

export type RespiratoryRateRecord = z.infer<typeof RespiratoryRateRecordSchema>;

export const HrvMetricsSchema = z.object({
  rmssd: z.number().min(0),
  sdnn: z.number().min(0).optional(),
  pnn50: z.number().min(0).max(100).optional(),
  sampleCount: z.number().int().min(0),
  algorithmVersion: z.string(),
  windowStartMs: z.number(),
  windowEndMs: z.number(),
  source: z.enum(["simulator", "ble", "manual", "imported"]),
});

export type HrvMetrics = z.infer<typeof HrvMetricsSchema>;

export const DailySummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deviceId: z.string(),
  recoveryScore: z.number().min(0).max(100).nullable(),
  strain: z.number().min(0).max(21).nullable(),
  restingHr: z.number().min(20).max(200).nullable(),
  overnightHrv: z.number().min(0).nullable(),
  sleepDurationMinutes: z.number().min(0).nullable(),
  avgSpO2: z.number().min(70).max(100).nullable(),
  avgTemperatureDeviation: z.number().nullable(),
  avgRespiratoryRate: z.number().min(4).max(60).nullable(),
  algorithmVersion: z.string(),
  generatedAt: z.number(),
});

export type DailySummary = z.infer<typeof DailySummarySchema>;

