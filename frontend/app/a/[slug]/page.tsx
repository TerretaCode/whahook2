"use client"

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AgencyPortalIndexPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  useEffect(() => {
    // Redirect to login page
    router.replace(`/a/${slug}/login`)
  }, [router, slug])

  return null
}
