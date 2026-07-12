import { prisma } from './prisma'

/**
 * Best-effort schema bootstrap for the Projects feature.
 *
 * Creates the Project table + Task.projectId link on demand using the app's
 * own DB connection, so a fresh database gets the schema without a manual
 * migration. Every statement is idempotent (IF NOT EXISTS) and this NEVER
 * throws: if a statement fails (e.g. the object already exists, or a pooled
 * connection rejects it), we ignore it and let the real query run. That way a
 * bootstrap hiccup can never take down a page — the actual Prisma query below
 * surfaces any genuine problem.
 *
 * Memoised per warm serverless instance so it only runs once, then no-ops.
 */

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#E91E8C',
    "icon" TEXT NOT NULL DEFAULT '📁',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId")`,
  `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" TEXT`,
  `CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task"("projectId")`,
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_projectId_fkey') THEN
       ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey"
         FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL;
     END IF;
   END $$`,
]

let ensured: Promise<void> | null = null

export function ensureProjectSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      for (const stmt of STATEMENTS) {
        try {
          await prisma.$executeRawUnsafe(stmt)
        } catch {
          // Best-effort — ignore. The object may already exist, or the pooled
          // connection rejected the statement; the real query handles the rest.
        }
      }
    })()
  }
  return ensured
}
