"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandedSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

/**
 * A spinner that uses the brand color (--brand-primary CSS variable)
 * Falls back to green-600 if no brand color is set
 */
export function BrandedSpinner({ className, size = "md" }: BrandedSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )}
      style={{ color: 'var(--brand-primary, #22c55e)' }}
    />
  )
}
