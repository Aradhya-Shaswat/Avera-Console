import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SyncBatchRequestSchema } from "@/lib/contracts/sync";

function getAuthenticatedUserId(_request: NextRequest): string | null {
  const token = _request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return token;
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
    const { getServerDb } = await import("@/lib/db/server/drizzle");
    const { dailySummaries } = await import("@/lib/db/server/schema");
    const { gte } = await import("drizzle-orm");

    const db = getServerDb();
    const summaries = await db
      .select()
      .from(dailySummaries)
      .where(gte(dailySummaries.syncedAt, new Date(sinceMs)));

    return NextResponse.json({
      summaries,
      serverTime: Date.now(),
    });
  } catch (error) {
    if (process.env.DATABASE_URL) {
      console.error("Sync GET error:", error);
      return jsonError("Database error", 500);
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

  const { entities } = parsed.data;

  if (!process.env.DATABASE_URL) {
    return jsonError("Cloud sync is not configured", 503);
  }

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

      accepted.push(entityId);
    } catch (error) {
      const data = entity.data as Record<string, unknown>;
      rejected.push({
        entityId: (data.id as string) ?? "unknown",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    accepted,
    conflicts,
    rejected,
    serverTime: Date.now(),
  });
}

