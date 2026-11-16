ALTER TYPE "public"."problem_type" ADD VALUE 'web';--> statement-breakpoint
ALTER TABLE "test_cases" ALTER COLUMN "input" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "test_cases" ALTER COLUMN "expected_output" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "script" text;--> statement-breakpoint
-- Kod jako lista plików: istniejący `code` przechodzi do jednego pliku `main.<rozszerzenie>`.
ALTER TABLE "code_snapshots" ADD COLUMN "files" jsonb;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "files" jsonb;--> statement-breakpoint
UPDATE "code_snapshots" SET "files" = jsonb_build_array(jsonb_build_object(
  'path', 'main.' || CASE "language" WHEN 'python' THEN 'py' WHEN 'cpp' THEN 'cpp' WHEN 'c++' THEN 'cpp'
    WHEN 'java' THEN 'java' WHEN 'csharp' THEN 'cs' WHEN 'c#' THEN 'cs' WHEN 'javascript' THEN 'js'
    WHEN 'php' THEN 'php' WHEN 'html' THEN 'html' WHEN 'css' THEN 'css' ELSE 'txt' END,
  'content', "code"));--> statement-breakpoint
UPDATE "submissions" SET "files" = jsonb_build_array(jsonb_build_object(
  'path', 'main.' || CASE "language" WHEN 'python' THEN 'py' WHEN 'cpp' THEN 'cpp' WHEN 'c++' THEN 'cpp'
    WHEN 'java' THEN 'java' WHEN 'csharp' THEN 'cs' WHEN 'c#' THEN 'cs' WHEN 'javascript' THEN 'js'
    WHEN 'php' THEN 'php' WHEN 'html' THEN 'html' WHEN 'css' THEN 'css' ELSE 'txt' END,
  'content', "code"));--> statement-breakpoint
ALTER TABLE "code_snapshots" ALTER COLUMN "files" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "files" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "code_snapshots" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "code";
