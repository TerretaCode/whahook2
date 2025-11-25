import { Card } from "@/components/ui/card"
import Link from "next/link"
import { LogoIcon } from "@/components/icons/LogoIcon"

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 via-white to-gray-50">
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center hover:opacity-80 transition-opacity">
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
        </Link>

        {/* Title & Description */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Form Content */}
        {children}
      </Card>
    </div>
  )
}
