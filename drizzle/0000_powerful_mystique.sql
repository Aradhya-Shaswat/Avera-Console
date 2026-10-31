CREATE TABLE "activity_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"type" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"strain" real NOT NULL,
	"avg_hr" integer,
	"max_hr" integer,
	"hr_zones" jsonb,
	"source" text NOT NULL,
	"algorithm_version" text,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"local_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"date" text NOT NULL,
	"recovery_score" integer,
	"strain" real,
	"resting_hr" integer,
	"overnight_hrv" real,
	"sleep_duration_minutes" integer,
	"avg_spo2" real,
	"avg_temperature_deviation" real,
	"avg_respiratory_rate" real,
	"algorithm_version" text,
	"generated_at" timestamp NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heart_rate_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"bpm" integer NOT NULL,
	"confidence" real,
	"quality" text,
	"source" text NOT NULL,
	"algorithm_version" text,
	"recorded_at" timestamp NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"local_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_interval_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"interval_ms" integer NOT NULL,
	"rr_interval_ms" integer,
	"artifact_flag" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"algorithm_version" text,
	"recorded_at" timestamp NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"local_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sleep_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"light_minutes" integer NOT NULL,
	"deep_minutes" integer NOT NULL,
	"rem_minutes" integer NOT NULL,
	"awake_minutes" integer NOT NULL,
	"stages" jsonb,
	"source" text NOT NULL,
	"is_estimate" boolean DEFAULT false NOT NULL,
	"algorithm_version" text,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"local_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heart_rate_records" ADD CONSTRAINT "heart_rate_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_interval_records" ADD CONSTRAINT "pulse_interval_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_sessions" ADD CONSTRAINT "sleep_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_user_time_idx" ON "activity_sessions" USING btree ("user_id","start_at");--> statement-breakpoint
CREATE INDEX "summary_user_date_idx" ON "daily_summaries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "hr_user_time_idx" ON "heart_rate_records" USING btree ("user_id","recorded_at");--> statement-breakpoint
CREATE INDEX "hr_device_idx" ON "heart_rate_records" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "pi_user_time_idx" ON "pulse_interval_records" USING btree ("user_id","recorded_at");--> statement-breakpoint
CREATE INDEX "sleep_user_time_idx" ON "sleep_sessions" USING btree ("user_id","start_at");