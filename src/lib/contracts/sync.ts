import { z } from "zod";

export type SyncDirection = "upload" | "download";
export type SyncStatus = "pending" | "synced" | "conflict" | "error";

export const SyncRecordSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum([
    "heart_rate",
    "pulse_interval",
    "ppg_sample",
    "imu_sample",
    "spo2",
    "temperature",
    "respiratory_rate",
    "sleep_session",
    "activity_session",
    "daily_summary",
  ]),
  entityId: z.string().uuid(),
  direction: z.enum(["upload", "download"]),
  status: z.enum(["pending", "synced", "conflict", "error"]),
  localVersion: z.number().int(),
  remoteVersion: z.number().int().nullable(),
  createdAt: z.number(),
  syncedAt: z.number().nullable(),
  errorMessage: z.string().nullable(),
});

export type SyncRecord = z.infer<typeof SyncRecordSchema>;

export const SyncBatchRequestSchema = z.object({
  deviceId: z.string(),
  since: z.number().optional(),
  entities: z.array(
    z.object({
      type: SyncRecordSchema.shape.entityType,
      data: z.record(z.string(), z.unknown()),
      localVersion: z.number().int(),
    })
  ),
});

export type SyncBatchRequest = z.infer<typeof SyncBatchRequestSchema>;

export const SyncBatchResponseSchema = z.object({
  accepted: z.array(z.string()),
  conflicts: z.array(
    z.object({
      entityId: z.string(),
      serverVersion: z.record(z.string(), z.unknown()),
    })
  ),
  rejected: z.array(z.object({ entityId: z.string(), reason: z.string() })),
  serverTime: z.number(),
});

export type SyncBatchResponse = z.infer<typeof SyncBatchResponseSchema>;
