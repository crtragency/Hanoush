import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  position: z.string().trim().max(100).optional().nullable(),
  image: z.string().url().optional().nullable(),
})

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured.' },
      { status: 503 }
    )
  }

  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const data: { position?: string | null; image?: string | null } = {}
    if (parsed.data.position !== undefined) data.position = parsed.data.position
    if (parsed.data.image !== undefined) data.image = parsed.data.image

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
    })

    return NextResponse.json({ position: user.position, image: user.image })
  } catch (error) {
    console.error('PUT /api/profile error:', error)
    return NextResponse.json({ error: 'Could not update profile' }, { status: 500 })
  }
}
