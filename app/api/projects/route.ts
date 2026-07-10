import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(8).optional(),
})

function dbGuard() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured. Add it in Vercel → Settings → Environment Variables.' },
      { status: 503 }
    )
  }
  return null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const guard = dbGuard()
  if (guard) return guard

  try {
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        tasks: { select: { completed: true } },
      },
    })

    return NextResponse.json({
      projects: projects.map((p) => {
        const total = p.tasks.length
        const completed = p.tasks.filter((t) => t.completed).length
        return {
          id: p.id,
          userId: p.userId,
          name: p.name,
          description: p.description,
          color: p.color,
          icon: p.icon,
          order: p.order,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          taskCount: total,
          completedCount: completed,
          progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        }
      }),
    })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('does not exist') || msg.includes('Project') || msg.includes('projectId') || msg.includes('relation')) {
      return NextResponse.json(
        { error: `SCHEMA_OUTDATED: The database is missing the Project table. Run prisma/migrations/manual_add_projects.sql in Vercel Postgres. (${msg})` },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const guard = dbGuard()
  if (guard) return guard

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const maxOrder = await prisma.project.aggregate({
      where: { userId: session.user.id },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? 0) + 1

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? '#E91E8C',
        icon: data.icon ?? '📁',
        order,
      },
    })

    return NextResponse.json(
      {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        taskCount: 0,
        completedCount: 0,
        progress: 0,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/projects error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
