import { defineConfig } from "drizzle-kit";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    try {
      process.loadEnvFile(".env");
    } catch {}
  }
}

export default defineConfig({
  schema: "./src/lib/db/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)!,
  },
});

