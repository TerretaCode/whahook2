"use client"

import { useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWorkspaceContext } from "@/contexts/WorkspaceContext"
import { 
  Smartphone, 
  Bot,
  Menu,
  X,
  ChevronRight,
  User,
  CreditCard,
  Building2,
  Users,
  Palette
} from "lucide-react"

interface SettingsLayoutProps {
  children: React.ReactNode
}

// Navigation items with permission requirements
// allowedRoles: which member roles can see this (undefined = owner only, empty array = everyone)
const settingsNavigation = [
  {
    id: 'branding',
    name: 'Branding',
    href: '/settings/branding',
    icon: Palette,
    description: 'Logo, colores y marca',
    allowedRoles: [] as string[] // Only owners (Enterprise)
  },
  {
    id: 'workspaces',
    name: 'Workspaces',
    href: '/settings/workspaces',
    icon: Building2,
    description: 'Manage workspaces & settings',
    allowedRoles: [] as string[] // Only owners
  },
  {
    id: 'connections',
    name: 'Connections',
    href: '/settings/connections',
    icon: Smartphone,
    description: 'WhatsApp & Web Widgets',
    allowedRoles: ['admin', 'client'] // Owners, admins, and clients (not agent/viewer)
  },
  {
    id: 'invitations',
    name: 'Invitaciones',
    href: '/settings/invitations',
    icon: Users,
    description: 'Invita a tu equipo',
    allowedRoles: ['client'] // Only clients can invite agent/viewer
  },
  {
    id: 'chatbot',
    name: 'Chatbot',
    href: '/settings/chatbot',
    icon: Bot,
    description: 'AI & API Keys',
    allowedRoles: [] as string[] // Only owners
  },
  {
    id: 'billing',
    name: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Plan & payments',
    allowedRoles: [] as string[] // Only owners
  },
  {
    id: 'profile',
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Your account',
    allowedRoles: ['admin', 'client', 'agent', 'messages', 'marketing'] // Everyone
  }
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isOwner, workspace, isLoading } = useWorkspaceContext()
  
  // Get user's role in the current workspace
  const memberRole = workspace?.member_role

  // Filter navigation based on user permissions
  const filteredNavigation = useMemo(() => {
    return settingsNavigation.filter(item => {
      // If user is a member (has member_role), use role-based filtering
      if (memberRole) {
        return item.allowedRoles.includes(memberRole)
      }
      
      // If user is owner (is_owner = true), show everything EXCEPT client-only items
      // Owners use Workspaces for invitations, not the Invitations page
      if (isOwner) {
        // Hide items that are exclusively for clients (like invitations)
        if (item.allowedRoles.length === 1 && item.allowedRoles[0] === 'client') {
          return false
        }
        return true
      }
      
      return false
    })
  }, [isOwner, memberRole])

  // Show loading state while workspace/role is being determined
  if (isLoading || !workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          
          {/* Sidebar Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your account</p>
                </div>
                <nav className="p-2">
                  {filteredNavigation.map((section) => {
                    const Icon = section.icon
                    const isActive = pathname === section.href || pathname?.startsWith(section.href + '/')
                    
                    return (
                      <Link
                        key={section.id}
                        href={section.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all",
                          "hover:bg-gray-50",
                          isActive && "bg-green-50 text-green-700 hover:bg-green-100"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5",
                          isActive ? "text-green-600" : "text-gray-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            isActive ? "text-green-700" : "text-gray-700"
                          )}>
                            {section.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {section.description}
                          </p>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-green-600" />
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                Settings Menu
              </span>
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden"
              >
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <nav className="p-2">
                    {filteredNavigation.map((section) => {
                      const Icon = section.icon
                      const isActive = pathname === section.href || pathname?.startsWith(section.href + '/')
                      
                      return (
                        <Link
                          key={section.id}
                          href={section.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-md transition-all",
                            "hover:bg-gray-50",
                            isActive && "bg-green-50 text-green-700"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-green-600" : "text-gray-400"
                          )} />
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium",
                              isActive ? "text-green-700" : "text-gray-700"
                            )}>
                              {section.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {section.description}
                            </p>
                          </div>
                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-green-600" />
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
