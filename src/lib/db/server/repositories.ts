import "server-only";
import { getServerDb } from "./drizzle";
import { users, userProfiles, dailySummaries, heartRateRecords, sleepSessions, activitySessions } from "./schema";
import { eq, gte, and, ne } from "drizzle-orm";

export const serverUserRepo = {
  async getOrCreateUser(externalId: string) {
    const db = getServerDb();
    const existing = await db.select().from(users).where(eq(users.externalId, externalId)).limit(1);
    if (existing.length > 0) return existing[0];
    const inserted = await db.insert(users).values({ externalId }).returning();
    return inserted[0];
  },
};

export const serverProfileRepo = {
  async getByUserId(userId: string) {
    const db = getServerDb();
    const records = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return records[0] ?? null;
  },

  async getByUsername(username: string) {
    const db = getServerDb();
    const records = await db.select().from(userProfiles).where(eq(userProfiles.username, username.toLowerCase())).limit(1);
    return records[0] ?? null;
  },

  async isUsernameAvailable(username: string, excludeUserId?: string) {
    const db = getServerDb();
    const normalized = username.toLowerCase().trim();
    if (excludeUserId) {
      const records = await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(and(eq(userProfiles.username, normalized), ne(userProfiles.userId, excludeUserId)))
        .limit(1);
      return records.length === 0;
    }
    const records = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.username, normalized))
      .limit(1);
    return records.length === 0;
  },

  async getOrCreateProfile(authUser: { id: string; email: string; name?: string | null; image?: string | null }) {
    const db = getServerDb();
    const existing = await this.getByUserId(authUser.id);
    if (existing) return existing;

    let baseHandle = (authUser.name || authUser.email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 16);
    if (!baseHandle) baseHandle = "user";

    let handle = baseHandle;
    let counter = 1;
    while (!(await this.isUsernameAvailable(handle))) {
      handle = `${baseHandle}${counter++}`;
    }

    const [inserted] = await db
      .insert(userProfiles)
      .values({
        userId: authUser.id,
        email: authUser.email,
        fullName: authUser.name || "AVERA Athlete",
        username: handle,
        avatarUrl: authUser.image || null,
        onboardingCompleted: false,
        onboardingStep: 1,
      })
      .returning();

    return inserted;
  },

  async updateProfile(userId: string, data: Partial<typeof userProfiles.$inferInsert>) {
    const db = getServerDb();
    const [updated] = await db
      .update(userProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();

    return updated ?? null;
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

