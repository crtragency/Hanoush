'use client'

import { useState } from 'react'

interface DBErrorBannerProps {
  message: string
}

export default function DBErrorBanner({ message }: DBErrorBannerProps) {
  const [copied, setCopied] = useState(false)

  const isSchemaError =
    message.includes('SCHEMA_OUTDATED') ||
    message.includes('userId') ||
    message.includes('imageUrl') ||
    message.includes('does not exist')

  const isEnvError =
    !isSchemaError && (
      message.toLowerCase().includes('database_url') ||
      message.toLowerCase().includes('connection failed') ||
      message.toLowerCase().includes('connect')
    )

  // The Projects feature needs its own table + link column, so show the
  // matching migration when the error is about projects.
  const isProjectSchema =
    message.includes('Project') || message.includes('projectId')

  const taskSql = `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");`

  const projectSql = `CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#E91E8C',
  "icon" TEXT NOT NULL DEFAULT '📁',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#E91E8C';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT '📁';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId");
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task"("projectId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_projectId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL;
  END IF;
END $$;`

  const sql = isProjectSchema ? projectSql : taskSql

  const handleCopy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 space-y-3 dark:border-rose-800/40 dark:bg-rose-900/20">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm">
            {isSchemaError ? 'Database schema outdated' : isEnvError ? 'Database not connected' : 'Could not load tasks'}
          </p>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5 leading-relaxed line-clamp-2">
            {isSchemaError
              ? isProjectSchema
                ? 'The Projects table is missing. Run the SQL below in Vercel Postgres to enable projects.'
                : 'Missing columns: userId and imageUrl. Run the SQL below in Vercel Postgres to fix instantly.'
              : message}
          </p>
        </div>
      </div>

      {isSchemaError && (
        <div className="pl-12 space-y-3">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
            Fix in 2 steps:
          </p>
          <ol className="text-xs text-rose-600/80 dark:text-rose-400/60 space-y-1 list-decimal list-inside">
            <li>Go to <strong>Vercel → Storage → your Postgres DB → Query</strong></li>
            <li>Paste and run this SQL:</li>
          </ol>
          <div className="relative">
            <pre className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{sql}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-white dark:bg-rose-800 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-rose-500/70 dark:text-rose-400/50">
            Or run locally: <code className="bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded">dotenv -e .env.local -- npx prisma db push</code>
          </p>
        </div>
      )}

      {isEnvError && (
        <div className="pl-12 space-y-1.5">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
            Fix in 3 steps:
          </p>
          <ol className="text-xs text-rose-600/80 dark:text-rose-400/60 space-y-1 list-decimal list-inside">
            <li>Go to <strong>Vercel → Your Project → Settings → Environment Variables</strong></li>
            <li>Add <code className="bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded">DATABASE_URL</code> (from Vercel Postgres or Neon)</li>
            <li>Redeploy, then run <code className="bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded">npx prisma db push</code></li>
          </ol>
        </div>
      )}
    </div>
  )
}
