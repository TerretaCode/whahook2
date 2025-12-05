/**
 * Auth layout - minimal wrapper for auth pages.
 * Branding and metadata are handled by the root layout.tsx
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

