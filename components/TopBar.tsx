'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ProfileAvatar from './ProfileAvatar'
import DarkModeToggle from './DarkModeToggle'
import { getGreeting, getTodayFormatted } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession()
  const [greeting, setGreeting] = useState('')
  const [dateStr, setDateStr] = useState('')

  const displayName = session?.user?.name || 'there'
  const displayPhoto = session?.user?.image || null

  useEffect(() => {
    setGreeting(getGreeting())
    setDateStr(getTodayFormatted())
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-[#2d0020]/90 backdrop-blur-md border-b border-pink-100 dark:border-[#E91E8C]/15 px-4 md:px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: hamburger + greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-[#E91E8C]/10 transition-colors text-[#C2185B] dark:text-[#E91E8C]"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-playfair text-base md:text-lg font-semibold text-[#3D0026] dark:text-pink-50 truncate">
              {greeting}, {displayName} 🌸
            </h1>
            <p className="text-xs text-[#C2185B]/60 dark:text-pink-400/60 hidden sm:block">{dateStr}</p>
          </div>
        </div>

        {/* Right: dark mode + avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <DarkModeToggle />
          <Link href="/settings" className="hover:opacity-80 transition-opacity">
            <ProfileAvatar name={displayName} photoUrl={displayPhoto} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  )
}
