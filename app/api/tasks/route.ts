import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isToday, isPast } from 'date-fns'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  imageUrl: z.string().url().optional().nullable(),
  projectId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured. Add it in Vercel → Settings → Environment Variables.' },
      { status: 503 }
    )
  }

  // Optional project scoping:
  //   ?projectId=<id>  → only that project's tasks
  //   ?projectId=none  → only tasks not assigned to any project (Inbox)
  const projectParam = req.nextUrl.searchParams.get('projectId')
  const projectFilter =
    projectParam === 'none'
      ? { projectId: null }
      : projectParam
        ? { projectId: projectParam }
        : {}

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id, ...projectFilter },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    const total = tasks.length
    const completedToday = tasks.filter(
      (t) => t.completed && t.updatedAt && isToday(t.updatedAt)
    ).length
    const pending = tasks.filter((t) => !t.completed).length
    const overdue = tasks.filter(
      (t) => !t.completed && t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate)
    ).length

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      stats: { total, completedToday, pending, overdue },
    })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('does not exist') || msg.includes('column') || msg.includes('userId') || msg.includes('imageUrl') || msg.includes('projectId')) {
      return NextResponse.json(
        { error: `SCHEMA_OUTDATED: The database is missing new columns (userId / imageUrl / projectId). Run the SQL migration in Vercel Postgres to fix. (${msg})` },
        { status: 503 }
      )
    }
    if (msg.includes('connect') || msg.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: `Database connection failed. Verify DATABASE_URL in Vercel → Settings → Environment Variables. (${msg})` },
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

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // If assigning to a project, verify it belongs to this user.
    if (data.projectId) {
      const owned = await prisma.project.findFirst({
        where: { id: data.projectId, userId: session.user.id },
        select: { id: true },
      })
      if (!owned) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    const maxOrder = await prisma.task.aggregate({
      where: { userId: session.user.id, projectId: data.projectId ?? null },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? 0) + 1

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        projectId: data.projectId ?? null,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        imageUrl: data.imageUrl ?? null,
        order,
      },
    })

    return NextResponse.json(
      {
        ...task,
        dueDate: task.dueDate?.toISOString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/tasks error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}
