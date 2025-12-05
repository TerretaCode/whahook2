import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Book, Code, Rocket, MessageSquare, Settings, Shield, ArrowRight } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">
              Everything you need to get started with WhaHook
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Quick Start Guide</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <QuickStartCard
                number="1"
                title="Create Account"
                description="Sign up for a free account and verify your email address"
              />
              <QuickStartCard
                number="2"
                title="Connect WhatsApp"
                description="Link your WhatsApp Business account using QR code"
              />
              <QuickStartCard
                number="3"
                title="Configure AI"
                description="Set up your chatbot responses and automation rules"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Browse Documentation</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DocCard
                icon={<Rocket className="w-8 h-8 text-green-600" />}
                title="Getting Started"
                description="Learn the basics and set up your first chatbot"
                topics={["Account Setup", "WhatsApp Connection", "First Conversation"]}
              />
              <DocCard
                icon={<MessageSquare className="w-8 h-8 text-green-600" />}
                title="Chatbot Configuration"
                description="Configure AI responses and conversation flows"
                topics={["AI Training", "Response Templates", "Conversation Logic"]}
              />
              <DocCard
                icon={<Code className="w-8 h-8 text-green-600" />}
                title="API Reference"
                description="Integrate WhaHook with your applications"
                topics={["REST API", "Webhooks", "Authentication"]}
              />
              <DocCard
                icon={<Settings className="w-8 h-8 text-green-600" />}
                title="Advanced Features"
                description="Unlock the full potential of WhaHook"
                topics={["Custom Integrations", "Workflows", "Analytics"]}
              />
              <DocCard
                icon={<Shield className="w-8 h-8 text-green-600" />}
                title="Security & Privacy"
                description="Keep your data safe and compliant"
                topics={["Data Encryption", "GDPR Compliance", "Access Control"]}
              />
              <DocCard
                icon={<Book className="w-8 h-8 text-green-600" />}
                title="Best Practices"
                description="Tips and tricks for optimal results"
                topics={["Conversation Design", "Performance Tips", "Common Patterns"]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Popular Articles</h2>
            <div className="space-y-4">
              <ArticleLink
                title="How to connect your WhatsApp Business account"
                category="Getting Started"
              />
              <ArticleLink
                title="Creating your first AI chatbot"
                category="Chatbot Configuration"
              />
              <ArticleLink
                title="Setting up appointment scheduling"
                category="Advanced Features"
              />
              <ArticleLink
                title="Understanding webhook events"
                category="API Reference"
              />
              <ArticleLink
                title="Best practices for conversation design"
                category="Best Practices"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Need More Help?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto">
              Contact Support
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function QuickStartCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function DocCard({ 
  icon, 
  title, 
  description, 
  topics 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  topics: string[]
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all">
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {topics.map((topic, index) => (
          <li key={index} className="text-sm text-green-600 hover:text-green-700 cursor-pointer">
            → {topic}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArticleLink({ title, category }: { title: string; category: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-200 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{category}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
}

