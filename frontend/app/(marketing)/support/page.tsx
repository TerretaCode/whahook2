import Link from "next/link"
import { MessageSquare, Mail, Book, HelpCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Support Center</h1>
          <p className="text-xl text-gray-600">We're here to help you succeed</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Link href="/docs" className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <Book className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Documentation</h3>
              <p className="text-gray-600">Browse our docs</p>
            </Link>
            <Link href="/guides" className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <HelpCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Guides</h3>
              <p className="text-gray-600">Step-by-step tutorials</p>
            </Link>
            <Link href="/contact" className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600">Get help via email</p>
            </Link>
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600">Chat with our team</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
