import { PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

/**
 * Best-effort schema bootstrap for the Projects feature.
 *
 * Creates the Project table + Task.projectId link on demand so a fresh
 * database gets the schema without a manual migration. DDL is executed over
 * the DIRECT (non-pooled) connection when DIRECT_URL is available: Supabase's
 * transaction pooler rejects Prisma's raw statements with 42P05 ("prepared
 * statement already exists"), while the direct session connection does not.
 *
 * Every statement is idempotent (IF NOT EXISTS) and this NEVER throws: any
 * failure is swallowed so a bootstrap hiccup can't take down a page — the
 * real Prisma query that follows surfaces any genuine problem.
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

async function runStatements(client: { $executeRawUnsafe: (q: string) => Promise<unknown> }) {
  for (const stmt of STATEMENTS) {
    await client.$executeRawUnsafe(stmt)
  }
}

let ensured: Promise<void> | null = null

export function ensureProjectSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const directUrl = process.env.DIRECT_URL
      if (directUrl) {
        // Dedicated non-pooled client for DDL; closed right after.
        const direct = new PrismaClient({ datasources: { db: { url: directUrl } } })
        try {
          await runStatements(direct)
          return
        } catch {
          // Fall through to the pooled connection attempt below.
        } finally {
          await direct.$disconnect().catch(() => {})
        }
      }
      try {
        await runStatements(prisma)
      } catch {
        // Best-effort — the real query surfaces any genuine problem.
      }
    })()
  }
  return ensured
}
