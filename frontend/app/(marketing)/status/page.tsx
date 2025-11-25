export default function StatusPage() {
  const services = [
    { name: "API", status: "Operational", uptime: "99.99%" },
    { name: "WhatsApp Integration", status: "Operational", uptime: "99.98%" },
    { name: "Dashboard", status: "Operational", uptime: "99.99%" },
    { name: "Database", status: "Operational", uptime: "100%" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">System Status</h1>
          <p className="text-xl text-green-600 font-semibold">All Systems Operational</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-600">Uptime: {service.uptime}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-gray-600">
            <p>Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
