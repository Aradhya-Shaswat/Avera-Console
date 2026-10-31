import { db } from "./dexie";
import type { HeartRateRecord, PulseIntervalRecord, DailySummary } from "@/lib/contracts/measurement";
import type { SleepSession } from "@/lib/contracts/sleep";
import type { ActivitySession } from "@/lib/contracts/activity";

const MS_PER_DAY = 86400000;

export const heartRateRepo = {
  async add(record: HeartRateRecord): Promise<void> {
    await db.heartRate.put(record);
  },

  async addBatch(records: HeartRateRecord[]): Promise<void> {
    await db.heartRate.bulkPut(records);
  },

  async queryRange(startMs: number, endMs: number): Promise<HeartRateRecord[]> {
    return db.heartRate
      .where("timestamp")
      .between(startMs, endMs)
      .toArray();
  },

  async queryLast(n: number): Promise<HeartRateRecord[]> {
    return db.heartRate
      .orderBy("timestamp")
      .reverse()
      .limit(n)
      .toArray();
  },

  async queryToday(): Promise<HeartRateRecord[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.queryRange(start.getTime(), Date.now());
  },
};

export const pulseIntervalRepo = {
  async add(record: PulseIntervalRecord): Promise<void> {
    await db.pulseIntervals.put(record);
  },

  async queryRange(startMs: number, endMs: number): Promise<PulseIntervalRecord[]> {
    return db.pulseIntervals
      .where("timestamp")
      .between(startMs, endMs)
      .toArray();
  },

  async queryOvernightForDate(dateMs: number): Promise<PulseIntervalRecord[]> {
    const sleepStart = dateMs - 9 * 3600000;
    const sleepEnd = dateMs;
    return this.queryRange(sleepStart, sleepEnd);
  },
};

export const sleepRepo = {
  async add(session: SleepSession): Promise<void> {
    await db.sleepSessions.put(session);
  },

  async queryLast(n: number): Promise<SleepSession[]> {
    return db.sleepSessions
      .orderBy("startMs")
      .reverse()
      .limit(n)
      .toArray();
  },

  async queryRange(startMs: number, endMs: number): Promise<SleepSession[]> {
    return db.sleepSessions
      .where("startMs")
      .between(startMs, endMs)
      .toArray();
  },
};

export const activityRepo = {
  async add(session: ActivitySession): Promise<void> {
    await db.activitySessions.put(session);
  },

  async queryToday(): Promise<ActivitySession[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return db.activitySessions
      .where("startMs")
      .between(start.getTime(), Date.now())
      .toArray();
  },

  async queryLast(n: number): Promise<ActivitySession[]> {
    return db.activitySessions
      .orderBy("startMs")
      .reverse()
      .limit(n)
      .toArray();
  },
};

export const dailySummaryRepo = {
  async upsert(summary: DailySummary): Promise<void> {
    await db.dailySummaries.put(summary);
  },

  async getByDate(date: string, deviceId: string): Promise<DailySummary | undefined> {
    return db.dailySummaries.get([date, deviceId]);
  },

  async queryLast(n: number): Promise<DailySummary[]> {
    return db.dailySummaries
      .orderBy("date")
      .reverse()
      .limit(n)
      .toArray();
  },
};

export const preferencesRepo = {
  async get() {
    return db.preferences.get("singleton");
  },

  async set(prefs: Partial<Omit<Parameters<typeof db.preferences.put>[0], "id">>) {
    const existing = await this.get();
    await db.preferences.put({
      id: "singleton",
      theme: "system",
      cloudSyncEnabled: false,
      maxHr: null,
      ageYears: null,
      weightKg: null,
      sleepGoalMinutes: 480,
      exportFormat: "json",
      ...existing,
      ...prefs,
    });
  },
};

