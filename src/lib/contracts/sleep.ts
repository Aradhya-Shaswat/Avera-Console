import { z } from "zod";

export type SleepStage = "awake" | "light" | "deep" | "rem" | "unknown";

export const SleepStageEpochSchema = z.object({
  startMs: z.number(),
  durationMs: z.number(),
  stage: z.enum(["awake", "light", "deep", "rem", "unknown"]),
  confidence: z.number().min(0).max(1),
});

export type SleepStageEpoch = z.infer<typeof SleepStageEpochSchema>;

export const SleepSessionSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string(),
  source: z.enum(["simulator", "ble", "manual", "imported"]),
  startMs: z.number(),
  endMs: z.number(),
  durationMinutes: z.number().min(0),
  inBedMinutes: z.number().min(0),
  awakeMinutes: z.number().min(0),
  lightMinutes: z.number().min(0),
  deepMinutes: z.number().min(0),
  remMinutes: z.number().min(0),
  cycles: z.number().int().min(0),
  stages: z.array(SleepStageEpochSchema),
  avgHrDuringSleep: z.number().min(20).max(200).nullable(),
  avgHrvDuringSleep: z.number().min(0).nullable(),
  respiratoryDisturbanceIndex: z.number().min(0).nullable(),
  isEstimate: z.boolean().default(false),
  algorithmVersion: z.string(),
});

export type SleepSession = z.infer<typeof SleepSessionSchema>;

