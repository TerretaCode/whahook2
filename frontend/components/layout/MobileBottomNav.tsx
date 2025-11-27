'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40",
      "bg-white border-t border-gray-200",
      "safe-bottom",
      className
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        <BottomNavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === '/dashboard'}
        />
        <BottomNavItem
          href="/conversations"
          icon={MessageSquare}
          label="Mensajes"
          active={pathname === '/conversations'}
        />
        <BottomNavItem
          href="/clients"
          icon={Users}
          label="Clientes"
          active={pathname === '/clients'}
        />
        <BottomNavItem
          href="/settings"
          icon={Settings}
          label="Ajustes"
          active={pathname?.startsWith('/settings')}
        />
      </div>
    </nav>
  )
}

function BottomNavItem({ 
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
}
