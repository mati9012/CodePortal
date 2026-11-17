CREATE TYPE "public"."group_kind" AS ENUM('class', 'group');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'flagged');--> statement-breakpoint
CREATE TABLE "group_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"user_id" uuid,
	"invited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "group_kind" DEFAULT 'class' NOT NULL,
	"school_year" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_ownerId_schoolYear_name_unique" UNIQUE("owner_id","school_year","name")
);
--> statement-breakpoint
CREATE TABLE "teacher_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"session_id" uuid,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exams" ALTER COLUMN "slug" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "languages" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "languages" SET DATA TYPE jsonb USING regexp_replace(to_jsonb("languages")::text, '"([^"]*)"', '["\1"]', 'g')::jsonb;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "languages" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "variants" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
UPDATE "problems" SET "variants" = '[]'::jsonb WHERE "variants" IS NULL;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "variants" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "results_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "input_spec" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "output_spec" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "difficulty" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "points" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "reference_language" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "reference_solution" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "student_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "waiting_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "review_status" "review_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "group_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "reference_ms" integer;--> statement-breakpoint
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_actions" ADD CONSTRAINT "teacher_actions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_actions" ADD CONSTRAINT "teacher_actions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_students_group_id_index" ON "group_students" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "teacher_actions_exam_id_created_at_index" ON "teacher_actions" USING btree ("exam_id","created_at");--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_group_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."group_students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "test_cases_problem_id_position_index" ON "test_cases" USING btree ("problem_id","position");--> statement-breakpoint
ALTER TABLE "test_cases" DROP COLUMN "group_no";