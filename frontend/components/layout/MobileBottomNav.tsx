'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'

export function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { hasPermission, isOwner, isLoading } = useWorkspaceContext()
  
  // Check permissions for navigation items
  // While loading, only show Dashboard to avoid flash of all items
  const canViewMessages = !isLoading && (isOwner || hasPermission('messages'))
  const canViewClients = !isLoading && (isOwner || hasPermission('clients'))
  const canViewSettings = !isLoading && (isOwner || hasPermission('settings'))

  // Build nav items based on permissions - memoized
  const navItems = useMemo(() => [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), active: pathname === '/dashboard', show: true },
    { href: '/conversations', icon: MessageSquare, label: t('conversations'), active: pathname === '/conversations', show: canViewMessages },
    { href: '/clients', icon: Users, label: t('clients'), active: pathname === '/clients', show: canViewClients },
    { href: '/settings', icon: Settings, label: t('settings'), active: pathname?.startsWith('/settings'), show: canViewSettings },
  ].filter(item => item.show), [pathname, canViewMessages, canViewClients, canViewSettings, t])

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40",
      "bg-white border-t border-gray-200",
      "safe-bottom",
      className
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <BottomNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={item.active}
          />
        ))}
      </div>
    </nav>
  )
}

const BottomNavItem = memo(function BottomNavItem({ 
  href, 
  icon: Icon, 
  label, 
  active 
}: { 
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg",
        "transition-all duration-200",
        active
          ? "text-green-600"
          : "text-gray-500 active:bg-gray-50"
      )}
    >
      <Icon className={cn(
        "w-6 h-6 transition-transform",
        active && "scale-110"
      )} />
      <span className="text-xs font-medium">
        {label}
      </span>
    </Link>
  )
})

