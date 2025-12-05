import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bot, Zap, Shield, BarChart3, Sparkles, CheckCircle, ArrowRight, Users, Globe, Smartphone } from "lucide-react"
import { HomePricingSection } from "@/components/home-pricing-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-transparent">
        <div className="container mx-auto px-4 py-16 md:py-28 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered WhatsApp Automation
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="text-green-600"> WhatsApp Business</span>
              <br />with AI Automation
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Connect your WhatsApp, automate responses with AI, and manage all conversations from one powerful platform. Save time, scale faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-lg px-9 py-5 h-auto shadow-lg hover:shadow-xl transition-all group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-9 py-5 h-auto border-2 hover:border-green-600 hover:text-green-600">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="90%" label="Faster Response" />
            <StatCard number="24/7" label="Availability" />
            <StatCard number="10x" label="More Capacity" />
            <StatCard number="100%" label="Satisfaction" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools to automate and manage your WhatsApp Business communications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-green-600" />}
              title="AI Assistant"
              description="Smart automated responses powered by Google Gemini. Bring your own API key and control your costs."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-green-600" />}
              title="Unified Inbox"
              description="Manage all your WhatsApp conversations in one clean, professional interface."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-green-600" />}
              title="Smart Automation"
              description="Set up automatic responses, business hours, and custom conversation flows."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-600" />}
              title="Enterprise Security"
              description="AES-256 encryption, secure storage, and full privacy compliance."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-green-600" />}
              title="Analytics & Insights"
              description="Detailed statistics on conversations, response times, and performance metrics."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title="AI/Manual Toggle"
              description="Switch between automated AI responses and manual attention with one click."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Set up your account in minutes and start automating
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Account"
              description="Sign up for free and access your dashboard"
            />
            <StepCard
              number="2"
              title="Connect WhatsApp"
              description="Scan QR code to link your WhatsApp Business account"
            />
            <StepCard
              number="3"
              title="Configure AI"
              description="Add your Gemini API key and customize automatic responses"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Save Time, Scale Your Business
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Automate repetitive responses while maintaining full control over important conversations.
              </p>
              <ul className="space-y-4">
                <BenefitItem text="Respond 24/7 without manual intervention" />
                <BenefitItem text="Reduce response times by up to 90%" />
                <BenefitItem text="Keep context across all conversations" />
                <BenefitItem text="Scale customer support without hiring" />
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 md:p-12">
              <div className="bg-white rounded-xl shadow-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Customer</p>
                    <p className="text-gray-900">What are your business hours?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">AI Assistant</p>
                    <p className="text-gray-900">We're open Monday to Friday, 9 AM to 6 PM. How can I help you today?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Perfect for Every Business
            </h2>
            <p className="text-xl text-gray-600">
              From small businesses to enterprises
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<Smartphone className="w-8 h-8 text-green-600" />}
              title="E-commerce"
              description="Handle order inquiries, shipping updates, and customer support automatically."
            />
            <UseCaseCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title="Service Businesses"
              description="Manage appointments, answer FAQs, and qualify leads 24/7."
            />
            <UseCaseCard
              icon={<Globe className="w-8 h-8 text-green-600" />}
              title="Agencies"
              description="Manage multiple client accounts from one centralized platform."
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <HomePricingSection />

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Customer Service?
          </h2>
          <p className="text-xl md:text-2xl text-green-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of businesses already automating their WhatsApp conversations with AI
          </p>
          <Link href="/register" className="inline-block">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto shadow-xl hover:shadow-2xl transition-all group">
              Start Free Trial Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-green-100 mt-6 text-lg">
            ✓ No commitment  ✓ Cancel anytime  ✓ No credit card required
          </p>
        </div>
      </section>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">{number}</div>
      <div className="text-sm md:text-base text-gray-600">{label}</div>
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

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-gray-700 text-lg leading-relaxed">{text}</span>
    </li>
  )
}

function UseCaseCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}


