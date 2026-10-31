import "server-only";
import { getServerDb } from "./drizzle";
import { users, dailySummaries, heartRateRecords, sleepSessions, activitySessions } from "./schema";
import { eq, gte, and } from "drizzle-orm";

export const serverUserRepo = {
  async getOrCreateUser(externalId: string) {
    const db = getServerDb();
    const existing = await db.select().from(users).where(eq(users.externalId, externalId)).limit(1);
    if (existing.length > 0) return existing[0];
    const inserted = await db.insert(users).values({ externalId }).returning();
    return inserted[0];
  },
};

export const serverSummaryRepo = {
  async querySince(userId: string, sinceDate: Date) {
    const db = getServerDb();
    return db
      .select()
      .from(dailySummaries)
      .where(and(eq(dailySummaries.userId, userId), gte(dailySummaries.syncedAt, sinceDate)));
  },
};

