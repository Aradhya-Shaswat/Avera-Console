import { z } from "zod";

export type ActivityType =
  | "rest"
  | "walk"
  | "run"
  | "cycling"
  | "swimming"
  | "strength"
  | "yoga"
  | "hiit"
  | "other";

export const HrZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  durationMinutes: z.number().min(0),
  minBpm: z.number().min(20).max(300),
  maxBpm: z.number().min(20).max(300),
});

export type HrZone = z.infer<typeof HrZoneSchema>;

export const ActivitySessionSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string(),
  source: z.enum(["simulator", "ble", "manual", "imported"]),
  type: z.enum([
    "rest",
    "walk",
    "run",
    "cycling",
    "swimming",
    "strength",
    "yoga",
    "hiit",
    "other",
  ]),
  startMs: z.number(),
  endMs: z.number(),
  durationMinutes: z.number().min(0),
  strain: z.number().min(0).max(21),
  avgHr: z.number().min(20).max(300).nullable(),
  maxHr: z.number().min(20).max(300).nullable(),
  hrZones: z.array(HrZoneSchema),
  kilojoules: z.number().min(0).nullable(),
  algorithmVersion: z.string(),
});

export type ActivitySession = z.infer<typeof ActivitySessionSchema>;

