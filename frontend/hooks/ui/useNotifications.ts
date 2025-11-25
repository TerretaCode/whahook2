import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ApiClient } from '@/lib/api-client'

export function useNotifications() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    // Load initial count
    loadUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [user])

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const response = await ApiClient.get<{ count: number }>('/notifications/unread-count')
      if (response.success && response.data) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    requestNotificationPermission
  }
}
