import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Bot, 
  Calendar, 
  Users, 
  BarChart3, 
  Zap,
  Shield,
  Globe,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Powerful Features for Modern Businesses</h1>
            <p className="text-xl text-gray-600">
              Everything you need to automate and scale your WhatsApp customer service
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-green-600" />}
              title="AI-Powered Chatbot"
              description="Advanced AI that understands context and provides natural, human-like responses to your customers 24/7."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-green-600" />}
              title="Multi-Account Management"
              description="Manage multiple WhatsApp accounts from a single dashboard. Perfect for teams and agencies."
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-green-600" />}
              title="Smart Scheduling"
              description="Automated appointment booking and calendar management integrated with your existing systems."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title="CRM Integration"
              description="Built-in CRM to manage contacts, track conversations, and maintain customer relationships."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-green-600" />}
              title="Advanced Analytics"
              description="Detailed insights into conversation metrics, response times, and customer satisfaction."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-green-600" />}
              title="Instant Responses"
              description="Automated quick replies and message templates for common questions and scenarios."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-600" />}
              title="Enterprise Security"
              description="Bank-level encryption, data privacy compliance, and secure message handling."
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-green-600" />}
              title="Multi-Language Support"
              description="AI that understands and responds in multiple languages automatically."
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-green-600" />}
              title="24/7 Availability"
              description="Never miss a customer message with round-the-clock automated responses."
            />
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-20">
            <DetailedFeature
              title="Intelligent Conversation Management"
              description="Our AI doesn't just respond—it understands context, remembers previous conversations, and provides personalized experiences for each customer."
              features={[
                "Context-aware responses",
                "Conversation history tracking",
                "Sentiment analysis",
                "Automatic language detection",
                "Smart conversation routing"
              ]}
              reverse={false}
            />
            <DetailedFeature
              title="Seamless Integrations"
              description="Connect WhaHook with your existing tools and workflows. We integrate with popular CRMs, calendars, and business applications."
              features={[
                "Google Calendar sync",
                "Zapier integration",
                "Custom API access",
                "Webhook support",
                "Third-party app connections"
              ]}
              reverse={true}
            />
            <DetailedFeature
              title="Team Collaboration"
              description="Built for teams with features that help your staff work together efficiently and provide better customer service."
              features={[
                "Team inbox",
                "Internal notes",
                "Assignment rules",
                "Performance metrics",
                "Role-based permissions"
              ]}
              reverse={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how WhaHook can transform your customer service
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-green-100 mt-6">
            ✓ No credit card required  ✓ 14-day free trial  ✓ Cancel anytime
          </p>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all">
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function DetailedFeature({ 
  title, 
  description, 
  features, 
  reverse 
}: { 
  title: string
  description: string
  features: string[]
  reverse: boolean
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-12 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'md:order-2' : ''}>
        <h3 className="text-3xl font-bold mb-4">{title}</h3>
        <p className="text-gray-600 text-lg mb-6">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 ${reverse ? 'md:order-1' : ''}`}>
        <div className="aspect-video bg-white rounded-lg shadow-lg flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-2" />
            <p className="text-sm">Feature Preview</p>
          </div>
        </div>
      </div>
    </div>
  )
}

