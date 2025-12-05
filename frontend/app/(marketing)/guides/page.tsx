import Link from "next/link"

export default function GuidesPage() {
  const guides = [
    { title: "Getting Started with WhaHook", category: "Beginner", time: "5 min read" },
    { title: "Setting Up Your First Chatbot", category: "Beginner", time: "10 min read" },
    { title: "Advanced AI Configuration", category: "Advanced", time: "15 min read" },
    { title: "Integrating with Your CRM", category: "Integration", time: "12 min read" },
    { title: "Best Practices for Conversation Design", category: "Best Practices", time: "8 min read" },
    { title: "Scaling Your WhatsApp Operations", category: "Advanced", time: "20 min read" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Guides</h1>
          <p className="text-xl text-gray-600">Step-by-step tutorials to master WhaHook</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4">
            {guides.map((guide, index) => (
              <Link key={index} href="#" className="block bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-600 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{guide.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded">{guide.category}</span>
                      <span>{guide.time}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

