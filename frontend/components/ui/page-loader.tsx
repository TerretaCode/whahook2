"use client"

import { Loader2 } from "lucide-react"

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = "Cargando..." }: PageLoaderProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
