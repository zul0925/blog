ALTER TABLE "posts" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "posts" ADD COLUMN "is_original" boolean DEFAULT true NOT NULL;
