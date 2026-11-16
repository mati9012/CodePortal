CREATE TYPE "public"."access_type" AS ENUM('link', 'password', 'list', 'sso');--> statement-breakpoint
CREATE TYPE "public"."checker_type" AS ENUM('exact', 'ignore_whitespace', 'float_tolerance', 'custom');--> statement-breakpoint
CREATE TYPE "public"."exam_mode" AS ENUM('test', 'contest');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('school', 'company');--> statement-breakpoint
CREATE TYPE "public"."problem_type" AS ENUM('io', 'unit');--> statement-breakpoint
CREATE TYPE "public"."protection_level" AS ENUM('loose', 'standard', 'exam');--> statement-breakpoint
CREATE TYPE "public"."results_visibility" AS ENUM('immediate', 'after_end', 'after_approval');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('organizer', 'participant', 'admin');--> statement-breakpoint
CREATE TYPE "public"."scoring_rule" AS ENUM('best', 'last', 'icpc', 'ioi');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('pending', 'active', 'finished', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('queued', 'running', 'done', 'error');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('OK', 'WA', 'TLE', 'MLE', 'RE', 'CE');--> statement-breakpoint
CREATE TABLE "code_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_events" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "editor_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" uuid NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	CONSTRAINT "editor_events_id_ts_pk" PRIMARY KEY("id","ts")
) PARTITION BY RANGE ("ts");
--> statement-breakpoint
-- Ręcznie dopisane: partycja domyślna, żeby zapisy działały, zanim powstanie
-- mechanizm tworzenia partycji dziennych (job w API albo pg_partman).
CREATE TABLE "editor_events_default" PARTITION OF "editor_events" DEFAULT;
--> statement-breakpoint
CREATE TABLE "exam_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"type" "access_type" NOT NULL,
	"secret_hash" text,
	"allowed_emails" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_problems" (
	"exam_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"points_override" integer,
	"pool_tag" text,
	CONSTRAINT "exam_problems_exam_id_problem_id_pk" PRIMARY KEY("exam_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"mode" "exam_mode" DEFAULT 'test' NOT NULL,
	"slug" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"duration_min" integer,
	"attempts" integer DEFAULT 1 NOT NULL,
	"protection_level" "protection_level" DEFAULT 'standard' NOT NULL,
	"results_visibility" "results_visibility" DEFAULT 'after_end' NOT NULL,
	"scoring_rule" "scoring_rule" DEFAULT 'best' NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "org_type" NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"grading_scale" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"statement_md" text NOT NULL,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"starter_code" jsonb,
	"time_limit_ms" integer DEFAULT 1000 NOT NULL,
	"memory_limit_mb" integer DEFAULT 256 NOT NULL,
	"type" "problem_type" DEFAULT 'io' NOT NULL,
	"checker_type" "checker_type" DEFAULT 'ignore_whitespace' NOT NULL,
	"checker_code" text,
	"variants" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"manual_score" real,
	"rubric" jsonb,
	"flagged_dishonest" boolean DEFAULT false NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_name" text,
	"started_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"ip" text,
	"user_agent" text,
	"risk_score" integer,
	"status" "session_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "similarity_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"submission_a" uuid NOT NULL,
	"submission_b" uuid NOT NULL,
	"score" real NOT NULL,
	"method" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_results" (
	"submission_id" uuid NOT NULL,
	"test_case_id" uuid NOT NULL,
	"verdict" "verdict" NOT NULL,
	"time_ms" integer,
	"memory_kb" integer,
	"output_excerpt" text,
	CONSTRAINT "submission_results_submission_id_test_case_id_pk" PRIMARY KEY("submission_id","test_case_id")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"status" "submission_status" DEFAULT 'queued' NOT NULL,
	"verdict" "verdict",
	"score" real,
	"time_ms" integer,
	"memory_kb" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"group_no" integer DEFAULT 0 NOT NULL,
	"input" text NOT NULL,
	"expected_output" text NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"role" "role" DEFAULT 'organizer' NOT NULL,
	"org_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "code_snapshots" ADD CONSTRAINT "code_snapshots_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_access" ADD CONSTRAINT "exam_access_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_problems" ADD CONSTRAINT "exam_problems_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_problems" ADD CONSTRAINT "exam_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similarity_pairs" ADD CONSTRAINT "similarity_pairs_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similarity_pairs" ADD CONSTRAINT "similarity_pairs_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similarity_pairs" ADD CONSTRAINT "similarity_pairs_submission_a_submissions_id_fk" FOREIGN KEY ("submission_a") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similarity_pairs" ADD CONSTRAINT "similarity_pairs_submission_b_submissions_id_fk" FOREIGN KEY ("submission_b") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_snapshots_session_id_problem_id_created_at_index" ON "code_snapshots" USING btree ("session_id","problem_id","created_at");--> statement-breakpoint
CREATE INDEX "editor_events_session_id_ts_index" ON "editor_events" USING btree ("session_id","ts");--> statement-breakpoint
CREATE INDEX "sessions_exam_id_index" ON "sessions" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "similarity_pairs_exam_id_problem_id_index" ON "similarity_pairs" USING btree ("exam_id","problem_id");--> statement-breakpoint
CREATE INDEX "submissions_session_id_problem_id_index" ON "submissions" USING btree ("session_id","problem_id");