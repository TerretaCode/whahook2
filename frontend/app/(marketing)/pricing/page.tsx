import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your business. Start with a 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <PricingCard
              name="Starter"
              price="€49"
              period="/month"
              description="Perfect for small businesses"
              features={[
                "1 WhatsApp account",
                "1 Web chatbot",
                "Basic AI automation",
                "100 conversations/month",
                "Email support",
                "Basic analytics"
              ]}
              cta="Get Started"
              ctaLink="/register"
            />

            {/* Professional Plan - Highlighted */}
            <PricingCard
              name="Professional"
              price="€99"
              period="/month"
              description="For growing businesses"
              features={[
                "3 WhatsApp accounts",
                "3 Web chatbots",
                "Advanced AI automation",
                "Smart appointment system",
                "CRM & contact management",
                "Analytics dashboard",
                "Priority support",
                "API access"
              ]}
              cta="Get Started"
              ctaLink="/register"
              highlighted={true}
            />

            {/* Enterprise Plan */}
            <PricingCard
              name="Enterprise"
              price="€149"
              period="/month"
              description="For large organizations"
              features={[
                "10 WhatsApp accounts",
                "Unlimited Web chatbots",
                "Unlimited AI automation",
                "Advanced calendar system",
                "Full CRM capabilities",
                "Custom integrations",
                "Advanced analytics",
                "Dedicated support",
                "Custom workflows"
              ]}
              cta="Get Started"
              ctaLink="/register"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <FAQItem
                question="Can I change plans later?"
                answer="Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
              />
              <FAQItem
                question="What payment methods do you accept?"
                answer="We accept all major credit cards (Visa, MasterCard, American Express) and PayPal."
              />
              <FAQItem
                question="Is there a free trial?"
                answer="Yes! All plans come with a 14-day free trial. No credit card required."
              />
              <FAQItem
                question="Can I cancel anytime?"
                answer="Yes, you can cancel your subscription at any time. No questions asked."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Customer Service?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already automating their WhatsApp conversations
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto">
              Start Free Trial Now
            </Button>
          </Link>
          <p className="text-green-100 mt-6">
            ✓ No commitment  ✓ Cancel anytime  ✓ No credit card required
          </p>
        </div>
      </section>
    </div>
  )
}

function PricingCard({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  cta, 
  ctaLink, 
  highlighted 
}: { 
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  ctaLink: string
  highlighted?: boolean
}) {
  return (
    <div className={`rounded-2xl p-8 ${highlighted ? 'bg-green-600 text-white ring-4 ring-green-600 ring-offset-4' : 'bg-white border-2 border-gray-200'}`}>
      <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
      <p className={`mb-6 ${highlighted ? 'text-green-100' : 'text-gray-600'}`}>{description}</p>
      <div className="mb-6">
        <span className="text-5xl font-bold">{price}</span>
        {period && <span className={`text-xl ${highlighted ? 'text-green-100' : 'text-gray-600'}`}>{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlighted ? 'text-green-200' : 'text-green-600'}`} />
            <span className={highlighted ? 'text-green-50' : 'text-gray-700'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaLink} className="block">
        <Button className={`w-full py-6 text-lg ${highlighted ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-green-600 text-white hover:bg-green-700'}`}>
          {cta}
        </Button>
      </Link>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  )
}
