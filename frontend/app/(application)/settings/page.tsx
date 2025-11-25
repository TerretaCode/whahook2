"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to connections by default
    router.replace('/settings/connections')
  }, [router])

  return null
}
