import { prisma } from './prisma'

/**
 * Self-healing schema bootstrap for the Projects feature.
 *
 * Instead of relying on a manual SQL migration being run against the *right*
 * database, we create the Project table + Task.projectId link on demand, using
 * the exact same connection the app runs its queries on. Every statement is
 * idempotent (IF NOT EXISTS), so this is safe to run repeatedly and will never
 * touch or drop existing data.
 *
 * The work is memoised per warm serverless instance so it only actually hits
 * the database once, then becomes a no-op for the rest of that instance's life.
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
        await prisma.$executeRawUnsafe(stmt)
      }
    })().catch((err) => {
      // Reset so a later request can retry (e.g. transient connection issues).
      ensured = null
      throw err
    })
  }
  return ensured
}
