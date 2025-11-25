export default function BlogPage() {
  const posts = [
    { title: "10 Ways to Improve Customer Service with AI", date: "Nov 20, 2025", category: "Tips" },
    { title: "The Future of WhatsApp Business Automation", date: "Nov 15, 2025", category: "Industry" },
    { title: "Case Study: How Company X Increased Sales by 300%", date: "Nov 10, 2025", category: "Case Study" },
    { title: "Best Practices for Chatbot Conversations", date: "Nov 5, 2025", category: "Best Practices" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-gray-600">Insights, tips, and news from WhaHook</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid gap-6">
            {posts.map((post, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-600 transition-all">
                <span className="text-sm text-green-600 font-medium">{post.category}</span>
                <h3 className="text-2xl font-semibold my-2">{post.title}</h3>
                <p className="text-gray-600">{post.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
