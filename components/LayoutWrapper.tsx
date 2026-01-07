'use client'

import { usePathname } from 'next/navigation'
import DesktopSidebar from '@/components/DesktopSidebar'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/auth'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}
