import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CareersPage() {
  const positions = [
    { title: "Senior Full Stack Developer", location: "Remote", type: "Full-time" },
    { title: "Product Designer", location: "Remote", type: "Full-time" },
    { title: "Customer Success Manager", location: "Hybrid", type: "Full-time" },
    { title: "DevOps Engineer", location: "Remote", type: "Full-time" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Careers</h1>
          <p className="text-xl text-gray-600">Join our team and help shape the future of customer service</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((position, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-600 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{position.location}</span>
                      <span>•</span>
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button className="bg-green-600 hover:bg-green-700">Apply Now</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

