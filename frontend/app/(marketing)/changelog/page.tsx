export default function ChangelogPage() {
  const updates = [
    { version: "2.1.0", date: "Nov 20, 2025", changes: ["New AI model with better accuracy", "Improved dashboard UI", "Bug fixes and performance improvements"] },
    { version: "2.0.0", date: "Nov 1, 2025", changes: ["Multi-language support", "Advanced analytics", "New CRM features"] },
    { version: "1.5.0", date: "Oct 15, 2025", changes: ["Appointment scheduling", "Calendar integration", "Team collaboration tools"] }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Changelog</h1>
          <p className="text-xl text-gray-600">Latest updates and improvements</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {updates.map((update, index) => (
              <div key={index} className="border-l-4 border-green-600 pl-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold text-green-600">{update.version}</span>
                  <span className="text-gray-600">{update.date}</span>
                </div>
                <ul className="space-y-2">
                  {update.changes.map((change, i) => (
                    <li key={i} className="text-gray-700">• {change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

