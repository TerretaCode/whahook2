import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Zap, Database, Mail, ShoppingCart, Code } from "lucide-react"

export default function IntegrationsPage() {
  const integrations = [
    { icon: <Calendar className="w-8 h-8" />, name: "Google Calendar", description: "Sync appointments automatically" },
    { icon: <Zap className="w-8 h-8" />, name: "Zapier", description: "Connect with 5000+ apps" },
    { icon: <Database className="w-8 h-8" />, name: "CRM Systems", description: "Salesforce, HubSpot, and more" },
    { icon: <Mail className="w-8 h-8" />, name: "Email Marketing", description: "Mailchimp, SendGrid integration" },
    { icon: <ShoppingCart className="w-8 h-8" />, name: "E-commerce", description: "Shopify, WooCommerce support" },
    { icon: <Code className="w-8 h-8" />, name: "Custom API", description: "Build your own integrations" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Integrations</h1>
          <p className="text-xl text-gray-600">Connect WhaHook with your favorite tools</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-600">
                  {integration.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{integration.name}</h3>
                <p className="text-gray-600">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-green-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Integration?</h2>
          <p className="text-xl mb-8">Our API makes it easy to build custom integrations</p>
          <Link href="/api-reference">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">View API Docs</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
