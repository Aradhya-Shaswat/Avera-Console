import { z } from "zod";

export type ConnectionState =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

export const DeviceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string().optional(),
  firmwareVersion: z.string().optional(),
  hardwareVersion: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

export const BatteryStatusSchema = z.object({
  percent: z.number().min(0).max(100),
  isCharging: z.boolean(),
  estimatedMinutesRemaining: z.number().optional(),
  measuredAt: z.number(),
});

export type BatteryStatus = z.infer<typeof BatteryStatusSchema>;

export const DeviceStateSchema = z.object({
  deviceId: z.string(),
  connectionState: z.enum([
    "disconnected",
    "scanning",
    "connecting",
    "connected",
    "error",
  ]),
  battery: BatteryStatusSchema.nullable(),
  lastSyncAt: z.number().nullable(),
  isSimulated: z.boolean(),
  errorMessage: z.string().nullable(),
});

export type DeviceState = z.infer<typeof DeviceStateSchema>;

