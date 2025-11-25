"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { FallbackStats } from "./components/FallbackStats"
import { 
  MessageSquare, 
  Users, 
  TrendingUp,
  Activity,
  ArrowRight,
  Settings,
  CreditCard,
  Bot,
  Calendar,
  BarChart3
} from "lucide-react"

interface DashboardStats {
  totalConversations: number
  activeConversations: number
  totalMessages: number
  responseRate: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    responseRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement real stats endpoint
      // const response = await ApiClient.request('/api/users/stats')
      // setStats(response.data)
      
      // Placeholder data for now
      setTimeout(() => {
        setStats({
          totalConversations: 0,
          activeConversations: 0,
          totalMessages: 0,
          responseRate: 0
        })
        setIsLoading(false)
      }, 500)
    } catch {
      setIsLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, <span className="font-medium text-gray-900">{user.profile?.full_name || user.email}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
        {/* Stats Grid con mejor diseño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Conversations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.totalConversations}
            </h3>
            <p className="text-sm text-gray-600">Conversations</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/conversations" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Active Conversations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">Live</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.activeConversations}
            </h3>
            <p className="text-sm text-gray-600">Active Today</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">Last updated: now</span>
            </div>
          </div>

          {/* Total Messages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">All time</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.totalMessages}
            </h3>
            <p className="text-sm text-gray-600">Messages Sent</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">Across all conversations</span>
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">Rate</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : `${stats.responseRate}%`}
            </h3>
            <p className="text-sm text-gray-600">Response Rate</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">Average response time</span>
            </div>
          </div>
        </div>

        {/* Fallback Statistics */}
        <div className="mb-8">
          <FallbackStats />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions - Mejorado */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              Quick Actions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/conversations">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Conversations</h3>
                  <p className="text-sm text-gray-600">View and manage chats</p>
                </div>
              </Link>

              <Link href="/chatbots">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Bot className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Chatbots</h3>
                  <p className="text-sm text-gray-600">Configure your bots</p>
                </div>
              </Link>

              <Link href="/appointments">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Appointments</h3>
                  <p className="text-sm text-gray-600">Manage your calendar</p>
                </div>
              </Link>

              <Link href="/analytics">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
                  <p className="text-sm text-gray-600">View detailed reports</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Your Plan</h2>
            <div className="space-y-4">
              <div>
                <p className="text-green-100 text-sm mb-1">Current Plan</p>
                <p className="text-2xl font-bold">Free Trial</p>
              </div>
              <div className="pt-4 border-t border-green-500">
                <p className="text-green-100 text-sm mb-2">14 days remaining</p>
                <div className="w-full bg-green-800 rounded-full h-2 mb-4">
                  <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <Link href="/billing">
                <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            Recent Activity
          </h2>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium mb-2">No recent activity</p>
            <p className="text-sm text-gray-500 mb-6">
              Your recent conversations and messages will appear here
            </p>
            <Link href="/conversations">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start a Conversation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
