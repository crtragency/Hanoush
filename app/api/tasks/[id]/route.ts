import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  completed: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  projectId: z.string().optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // When moving to another project, verify the target belongs to this user.
    if (data.projectId) {
      const owned = await prisma.project.findFirst({
        where: { id: data.projectId, userId: session.user.id },
        select: { id: true },
      })
      if (!owned) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
      },
    })

    return NextResponse.json({
      ...task,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(`PATCH /api/tasks/${params.id} error:`, error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/tasks/${params.id} error:`, error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
