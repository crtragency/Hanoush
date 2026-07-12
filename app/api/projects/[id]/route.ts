import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ensureProjectSchema } from '@/lib/ensureSchema'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(8).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureProjectSchema()
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { tasks: { select: { completed: true } } },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const total = project.tasks.length
    const completed = project.tasks.filter((t) => t.completed).length

    return NextResponse.json({
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      order: project.order,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      taskCount: total,
      completedCount: completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    })
  } catch (error) {
    console.error(`GET /api/projects/${params.id} error:`, error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureProjectSchema()
    const body = await req.json()
    const data = updateSchema.parse(body)

    const existing = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
    })

    return NextResponse.json({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(`PATCH /api/projects/${params.id} error:`, error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureProjectSchema()
    const existing = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // ?withTasks=1 deletes the project's tasks too; otherwise they are kept
    // (their projectId is set to NULL by the ON DELETE SET NULL relation).
    const withTasks = req.nextUrl.searchParams.get('withTasks') === '1'
    if (withTasks) {
      await prisma.task.deleteMany({
        where: { projectId: params.id, userId: session.user.id },
      })
    }

    await prisma.project.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/projects/${params.id} error:`, error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
