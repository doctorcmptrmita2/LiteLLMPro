import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function BlogPage() {
  const posts = [
    {
      title: "CodexFlow 1.2 Released: Admin Panel and More",
      excerpt: "New admin panel, user management, plan editing, and audit log features make CodexFlow more powerful than ever.",
      date: "January 2, 2026",
      category: "Announcement",
      image: "🚀",
      href: "/blog/cfx-1-2-release",
    },
    {
      title: "70% Cost Savings with 3-Stage Routing",
      excerpt: "How does smart model selection work and why is it much more efficient than using a single model?",
      date: "December 28, 2025",
      category: "Technical",
      image: "💰",
      href: "/blog/cost-savings",
    },
    {
      title: "OpenRouter Integration: One API, All Models",
      excerpt: "Access Claude, GPT, DeepSeek, and more with a single API key through OpenRouter.",
      date: "December 25, 2025",
      category: "Integration",
      image: "🔗",
      href: "/blog/openrouter-integration",
    },
    {
      title: "AI Coding in VS Code: CodexFlow Agent Guide",
      excerpt: "CodexFlow Agent installation, configuration, and best usage practices.",
      date: "December 20, 2025",
      category: "Guide",
      image: "💻",
      href: "/blog/codexflow-guide",
    },
    {
      title: "LiteLLM vs Direct API: Which is Better?",
      excerpt: "A detailed analysis of the advantages and disadvantages of using an AI gateway.",
      date: "December 15, 2025",
      category: "Comparison",
      image: "⚖️",
      href: "/blog/litellm-comparison",
    },
    {
      title: "The CodexFlow Story: Why We Started This Project",
      excerpt: "The journey from Cursor and Windsurf's shortcomings to the birth of CodexFlow.",
      date: "December 10, 2025",
      category: "Story",
      image: "📖",
      href: "/blog/our-story",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Blog</h1>
            <p className="text-xl text-slate-400">Updates, guides, and technical articles</p>
          </div>

          {/* Featured Post */}
          <Link href={posts[0].href} className="block mb-12">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/50 transition">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{posts[0].category}</span>
                <span className="text-slate-500">{posts[0].date}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{posts[0].title}</h2>
              <p className="text-slate-400 text-lg">{posts[0].excerpt}</p>
            </div>
          </Link>

          {/* Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
              <Link
                key={post.title}
                href={post.href}
                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition group"
              >
                <div className="h-40 bg-slate-800 flex items-center justify-center">
                  <span className="text-6xl">{post.image}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">{post.category}</span>
                    <span className="text-slate-500 text-sm">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition mb-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
