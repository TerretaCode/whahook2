export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: November 24, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">We use cookies for:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Authentication and security</li>
              <li>Remembering your preferences</li>
              <li>Analytics and performance monitoring</li>
              <li>Improving user experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                <p className="text-gray-700">Required for the website to function properly. Cannot be disabled.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
                <p className="text-gray-700">Help us understand how visitors interact with our website.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Preference Cookies</h3>
                <p className="text-gray-700">Remember your settings and preferences.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies through your browser settings. 
              Please note that removing or blocking cookies may impact your user experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about our Cookie Policy, contact us at: privacy@whahook.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

