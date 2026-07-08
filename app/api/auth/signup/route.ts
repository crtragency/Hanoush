import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
})

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not configured. Add it in Vercel → Settings → Environment Variables.' },
      { status: 503 }
    )
  }

  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ name }, { email }] },
    })
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.name === name
              ? 'This name is already taken'
              : 'This email is already registered',
        },
        { status: 409 }
      )
    }

    await prisma.user.create({
      data: { name, email, password: hashPassword(password) },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/auth/signup error:', error)
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
  }
}
