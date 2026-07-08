'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MotivationalToasts from './MotivationalToasts'
import ProfileSetupPrompt from './ProfileSetupPrompt'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session, status } = useSession()

  // First-run: a signed-in user who hasn't set their position yet.
  const needsSetup = status === 'authenticated' && !session?.user?.position

  return (
    <div className="flex h-screen overflow-hidden bg-cream dark:bg-[#1a0011]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 page-enter">
          {children}
        </main>
      </div>

      <MotivationalToasts />

      {needsSetup && <ProfileSetupPrompt />}
    </div>
  )
}
