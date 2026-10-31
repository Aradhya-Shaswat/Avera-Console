import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { SyncBatchRequestSchema } from "@/lib/contracts/sync";
import { getServerDb } from "@/lib/db/server/drizzle";
import { serverUserRepo } from "@/lib/db/server/repositories";
import {
  dailySummaries,
  heartRateRecords,
  pulseIntervalRecords,
  sleepSessions,
  activitySessions,
} from "@/lib/db/server/schema";
import { gte, eq, and } from "drizzle-orm";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (token) return token;
  const param = request.nextUrl.searchParams.get("userId");
  if (param) return param;
  return "avera-default-user";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED !== "true") {
    return jsonError("Cloud sync is not enabled", 403);
  }

  const userId = getAuthenticatedUserId(request);
  if (!userId) return jsonError("Unauthorized", 401);

  const since = request.nextUrl.searchParams.get("since");
  const sinceMs = since ? Number(since) : 0;

  try {
    const user = await serverUserRepo.getOrCreateUser(userId);
    const db = getServerDb();
    const summaries = await db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.userId, user.id),
          gte(dailySummaries.syncedAt, new Date(sinceMs))
        )
      );

    return NextResponse.json({
      status: "connected",
      branch: process.env.NEON_BRANCH ?? "production",
      user: { id: user.id, externalId: user.externalId },
      summaries,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Sync GET error:", error);
    if (process.env.DATABASE_URL) {
      return jsonError(
        error instanceof Error ? error.message : "Database error",
        500
      );
    }
    return jsonError("Cloud sync is not configured", 503);
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED !== "true") {
    return jsonError("Cloud sync is not enabled", 403);
  }

  const userId = getAuthenticatedUserId(request);
  if (!userId) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = SyncBatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(`Validation failed: ${parsed.error.message}`, 422);
  }

  const { deviceId, entities } = parsed.data;

  if (!process.env.DATABASE_URL) {
    return jsonError("Cloud sync is not configured", 503);
  }

  try {
    const user = await serverUserRepo.getOrCreateUser(userId);
    const db = getServerDb();
    const accepted: string[] = [];
    const conflicts: { entityId: string; serverVersion: Record<string, unknown> }[] = [];
    const rejected: { entityId: string; reason: string }[] = [];

    for (const entity of entities) {
      try {
        const data = entity.data as Record<string, unknown>;
        const entityId = data.id as string;

        if (typeof entityId !== "string") {
          rejected.push({ entityId: "unknown", reason: "Missing entity id" });
          continue;
        }

        if (entity.type === "daily_summary") {
          await db
            .insert(dailySummaries)
            .values({
              id: entityId,
              userId: user.id,
              deviceId,
              date: String(data.date ?? new Date().toISOString().split("T")[0]),
              recoveryScore: typeof data.recoveryScore === "number" ? data.recoveryScore : null,
              strain: typeof data.strain === "number" ? data.strain : null,
              restingHr: typeof data.restingHr === "number" ? data.restingHr : null,
              overnightHrv: typeof data.overnightHrv === "number" ? data.overnightHrv : null,
              sleepDurationMinutes: typeof data.sleepDurationMinutes === "number" ? data.sleepDurationMinutes : null,
              avgSpO2: typeof data.avgSpO2 === "number" ? data.avgSpO2 : null,
              avgTemperatureDeviation: typeof data.avgTemperatureDeviation === "number" ? data.avgTemperatureDeviation : null,
              avgRespiratoryRate: typeof data.avgRespiratoryRate === "number" ? data.avgRespiratoryRate : null,
              algorithmVersion: typeof data.algorithmVersion === "string" ? data.algorithmVersion : "1.0.0",
              generatedAt: data.generatedAt ? new Date(data.generatedAt as number | string) : new Date(),
              syncedAt: new Date(),
            })
            .onConflictDoNothing();
          accepted.push(entityId);
        } else if (entity.type === "heart_rate") {
          await db
            .insert(heartRateRecords)
            .values({
              id: entityId,
              userId: user.id,
              deviceId,
              bpm: Number(data.bpm ?? 60),
              confidence: typeof data.confidence === "number" ? data.confidence : null,
              quality: typeof data.quality === "string" ? data.quality : null,
              source: typeof data.source === "string" ? data.source : "simulator",
              algorithmVersion: typeof data.algorithmVersion === "string" ? data.algorithmVersion : null,
              recordedAt: data.recordedAt ? new Date(data.recordedAt as number | string) : new Date(),
              syncedAt: new Date(),
              localVersion: entity.localVersion,
            })
            .onConflictDoNothing();
          accepted.push(entityId);
        } else if (entity.type === "pulse_interval") {
          await db
            .insert(pulseIntervalRecords)
            .values({
              id: entityId,
              userId: user.id,
              deviceId,
              intervalMs: Number(data.intervalMs ?? 800),
              rrIntervalMs: typeof data.rrIntervalMs === "number" ? data.rrIntervalMs : null,
              artifactFlag: Boolean(data.artifactFlag),
              source: typeof data.source === "string" ? data.source : "simulator",
              algorithmVersion: typeof data.algorithmVersion === "string" ? data.algorithmVersion : null,
              recordedAt: data.recordedAt ? new Date(data.recordedAt as number | string) : new Date(),
              syncedAt: new Date(),
              localVersion: entity.localVersion,
            })
            .onConflictDoNothing();
          accepted.push(entityId);
        } else if (entity.type === "sleep_session") {
          await db
            .insert(sleepSessions)
            .values({
              id: entityId,
              userId: user.id,
              deviceId,
              startAt: data.startAt ? new Date(data.startAt as number | string) : new Date(),
              endAt: data.endAt ? new Date(data.endAt as number | string) : new Date(),
              durationMinutes: Number(data.durationMinutes ?? 0),
              lightMinutes: Number(data.lightMinutes ?? 0),
              deepMinutes: Number(data.deepMinutes ?? 0),
              remMinutes: Number(data.remMinutes ?? 0),
              awakeMinutes: Number(data.awakeMinutes ?? 0),
              stages: data.stages ?? [],
              source: typeof data.source === "string" ? data.source : "simulator",
              isEstimate: Boolean(data.isEstimate),
              algorithmVersion: typeof data.algorithmVersion === "string" ? data.algorithmVersion : null,
              syncedAt: new Date(),
              localVersion: entity.localVersion,
            })
            .onConflictDoNothing();
          accepted.push(entityId);
        } else if (entity.type === "activity_session") {
          await db
            .insert(activitySessions)
            .values({
              id: entityId,
              userId: user.id,
              deviceId,
              type: typeof data.type === "string" ? data.type : "general",
              startAt: data.startAt ? new Date(data.startAt as number | string) : new Date(),
              endAt: data.endAt ? new Date(data.endAt as number | string) : new Date(),
              durationMinutes: Number(data.durationMinutes ?? 0),
              strain: Number(data.strain ?? 0),
              avgHr: typeof data.avgHr === "number" ? data.avgHr : null,
              maxHr: typeof data.maxHr === "number" ? data.maxHr : null,
              hrZones: data.hrZones ?? [],
              source: typeof data.source === "string" ? data.source : "simulator",
              algorithmVersion: typeof data.algorithmVersion === "string" ? data.algorithmVersion : null,
              syncedAt: new Date(),
              localVersion: entity.localVersion,
            })
            .onConflictDoNothing();
          accepted.push(entityId);
        } else {
          accepted.push(entityId);
        }
      } catch (error) {
        const data = entity.data as Record<string, unknown>;
        rejected.push({
          entityId: (data?.id as string) ?? "unknown",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      accepted,
      conflicts,
      rejected,
      branch: process.env.NEON_BRANCH ?? "production",
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Sync POST error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Failed to process sync batch",
      500
    );
  }
}

