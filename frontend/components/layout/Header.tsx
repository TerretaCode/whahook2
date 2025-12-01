'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Bell, Menu, X } from 'lucide-react'
import { useScrollDirection } from '@/hooks/ui/useScrollDirection'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/ui/useNotifications'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { useBranding } from '@/hooks/useBranding'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { LogoIcon } from '@/components/icons/LogoIcon'

export function Header() {
  const scrollDirection = useScrollDirection({ threshold: 15 })
  const { user } = useAuth()
  const { hasUnread } = useNotifications()
  const { hasPermission, isOwner, workspace, isLoading: isWorkspaceLoading } = useWorkspaceContext()
  const { branding, isWhitelabel, hasCustomBranding, isLoading: isBrandingLoading } = useBranding()
  
  // Wait for both workspace and branding to load before showing logo
  const isLoadingLogo = isWorkspaceLoading || isBrandingLoading
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const isAdmin = user?.profile?.subscription_tier === 'enterprise' && user?.profile?.account_type === 'agency'
  
  // Check permissions for navigation items
  const canViewMessages = isOwner || hasPermission('messages')
  const canViewClients = isOwner || hasPermission('clients')
  const canViewSettings = isOwner || hasPermission('settings')

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.pageYOffset)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Don't hide header when mobile menu or notifications are open
  const shouldHideHeader = scrollDirection === 'down' && scrollY > 80 && !mobileMenuOpen && !notificationsOpen

  return (
    <>
      {/* Header Desktop/Mobile */}
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "bg-white/95 backdrop-blur-md border-b border-gray-200",
          "shadow-sm"
        )}
        initial={false}
        animate={{
          y: shouldHideHeader ? -100 : 0,
          opacity: shouldHideHeader ? 0 : 1
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo - Show loading placeholder, then agency branding or WhaHook */}
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {isLoadingLogo ? (
                // Loading placeholder while workspace/branding loads
                <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
              ) : isWhitelabel && (branding.logo_url || branding.logo_text) ? (
                <>
                  {branding.logo_url && (
                    <img 
                      src={branding.logo_url} 
                      alt="Logo" 
                      className="h-8 object-contain"
                    />
                  )}
                  {branding.logo_text && (
                    <span 
                      className="text-xl font-bold leading-tight"
                      style={{ color: branding.primary_color }}
                    >
                      {branding.logo_text}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <LogoIcon className="w-8 h-8 text-green-600" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl font-bold text-gray-900 leading-tight">
                      WhaHook
                    </span>
                    <span className="text-[10px] leading-tight ml-0.5">
                      <span className="text-gray-900">by </span>
                      <span className="text-green-600">TerretaCode</span>
                    </span>
                  </div>
                </>
              )}
            </Link>

            {/* Desktop Navigation - Only show if logged in */}
            {user && (
              <nav className="hidden md:flex items-center gap-6">
                <NavLink href="/dashboard">
                  Dashboard
                </NavLink>
                {canViewMessages && (
                  <NavLink href="/conversations">
                    Messages
                  </NavLink>
                )}
                {canViewClients && (
                  <NavLink href="/clients">
                    Clients
                  </NavLink>
                )}
                {canViewSettings && (
                  <NavLink href="/settings">
                    Settings
                  </NavLink>
                )}
                {isAdmin && (
                  <Link href="/admin/users" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </nav>
            )}

            {/* User Menu (Desktop) - Logged in */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-gray-100 relative"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>
                <Link href="/settings/profile">
                  <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all">
                    <AvatarImage src={user.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                      {user.profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            ) : (
              /* Auth Buttons (Desktop) - Not logged in */
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin/users">
                      <Button variant="ghost" size="icon" className="text-purple-600">
                        <Shield className="w-5 h-5" />
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                  >
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Button>
                  <Link href="/settings/profile">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-green-100 text-green-700 text-sm font-semibold">
                        {user.profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Spacer (para que el contenido no quede detrás del header fixed) */}
      <div className="h-16" />

      {/* Mobile Menu - Only for non-logged users */}
      {!user && (
        <motion.div
          className={cn(
            "fixed inset-x-0 top-16 z-40 bg-white md:hidden",
            "overflow-hidden"
          )}
          initial={{ height: 0 }}
          animate={{ height: mobileMenuOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <div className="space-y-2">
              <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </motion.div>
      )}

      {/* Notifications Panel (Mobile & Desktop) */}
      {notificationsOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setNotificationsOpen(false)}
          />
          
          {/* Notifications Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed top-16 right-0 z-50 bg-white shadow-xl",
              "md:top-20 md:right-4 md:w-96 md:rounded-lg md:border md:border-gray-200",
              "w-full h-[calc(100vh-4rem)] md:h-auto md:max-h-[calc(100vh-6rem)]",
              "overflow-hidden flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-600 text-center py-8">
                No new notifications
              </p>
            </div>
          </motion.div>
        </>
      )}
    </>
  )
}

// NavLink Component (Desktop)
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
    >
      {children}
    </Link>
  )
}
