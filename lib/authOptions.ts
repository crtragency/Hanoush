import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        name: { label: 'Name', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { name: credentials.name },
        })
        if (!user) return null
        if (!verifyPassword(credentials.password, user.password)) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          position: user.position,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, seed the token from the authorized user.
      if (user) {
        token.sub = (user as { id: string }).id
        token.name = user.name
        token.email = user.email
        token.picture = user.image ?? null
        token.position = (user as { position?: string | null }).position ?? null
      }

      // When the client calls `update()`, refresh profile fields from the DB
      // (used after the user sets their position / photo).
      if (trigger === 'update' && token.sub) {
        const fresh = await prisma.user.findUnique({ where: { id: token.sub } })
        if (fresh) {
          token.name = fresh.name
          token.email = fresh.email
          token.picture = fresh.image ?? null
          token.position = fresh.position ?? null
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.name = (token.name as string) ?? null
        session.user.email = (token.email as string) ?? null
        session.user.image = (token.picture as string) ?? null
        session.user.position = (token.position as string) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
