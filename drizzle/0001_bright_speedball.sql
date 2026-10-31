CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"age" integer DEFAULT 28,
	"weight_kg" real DEFAULT 72,
	"max_hr" integer DEFAULT 188,
	"sleep_goal_hours" real DEFAULT 8,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "user_profile_user_id_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profile_username_idx" ON "user_profiles" USING btree ("username");