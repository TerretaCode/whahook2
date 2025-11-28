"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to connections by default
    router.replace('/settings/connections')
  }, [router])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
      <p className="text-sm text-gray-500">Redirigiendo...</p>
    </div>
  )
}
