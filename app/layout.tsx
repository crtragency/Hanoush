import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SessionProvider from '@/components/SessionProvider'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'todolist',
  description: 'Your personal task manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} font-dm antialiased`}>
        <ThemeScript />
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2d0020',
              color: '#fce7f3',
              border: '1px solid rgba(233,30,140,0.25)',
              borderRadius: '14px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.40)',
            },
            success: {
              iconTheme: { primary: '#E91E8C', secondary: '#2d0020' },
            },
          }}
        />
      </body>
    </html>
  )
}

function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              if (theme !== 'light') {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  )
}
