-- Manual migration: adds Projects and links Tasks to them.
-- Run this once against your Vercel Postgres database (SQL editor or `psql`)
-- if you are NOT using `prisma migrate`. It is idempotent and safe to re-run.

-- 1. Projects table
CREATE TABLE IF NOT EXISTS "Project" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL DEFAULT '',
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "color"       TEXT NOT NULL DEFAULT '#E91E8C',
  "icon"        TEXT NOT NULL DEFAULT '📁',
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project" ("userId");
CREATE INDEX IF NOT EXISTS "Project_userId_order_idx" ON "Project" ("userId", "order");

-- 2. Link column on Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task" ("projectId");

-- 3. Foreign key (tasks survive project deletion — projectId is set to NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_projectId_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
