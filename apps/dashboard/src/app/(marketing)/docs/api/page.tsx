import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">API Referansı</h1>
            <p className="text-xl text-slate-400">OpenAI-uyumlu REST API</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="sticky top-24 space-y-2">
                <a href="#authentication" className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">Authentication</a>
                <a href="#chat-completions" className="block px-4 py-2 text-blue-400 bg-blue-500/10 rounded-lg">Chat Completions</a>
                <a href="#streaming" className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">Streaming</a>
                <a href="#errors" className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">Errors</a>
                <a href="#rate-limits" className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">Rate Limits</a>
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Base URL */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Base URL</h2>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <code className="text-green-400">https://api.codexflow.dev/v1</code>
                </div>
              </section>

              {/* Authentication */}
              <section id="authentication">
                <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
                <p className="text-slate-400 mb-4">Tüm API istekleri Bearer token ile kimlik doğrulaması gerektirir.</p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Header</span>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-slate-300">Authorization: Bearer <span className="text-yellow-400">cfx_your_api_key</span></code>
                  </pre>
                </div>
              </section>

              {/* Chat Completions */}
              <section id="chat-completions">
                <h2 className="text-2xl font-bold text-white mb-4">Chat Completions</h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-mono">POST</span>
                  <code className="text-slate-300">/v1/chat/completions</code>
                </div>
                
                <h3 className="text-lg font-semibold text-white mt-8 mb-4">Request Body</h3>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <pre className="p-4 text-sm overflow-x-auto">
{`{
  "model": "auto",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Write a Python function"}
  ],
  "stream": false,
  "max_tokens": 4096,
  "temperature": 0.7
}`}
                  </pre>
                </div>

                <h3 className="text-lg font-semibold text-white mt-8 mb-4">Headers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Header</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Zorunlu</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-blue-400">X-CFX-Stage</td>
                        <td className="py-3 px-4 text-slate-400">Hayır</td>
                        <td className="py-3 px-4 text-slate-300">plan | code | review | direct</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-blue-400">X-CFX-Session</td>
                        <td className="py-3 px-4 text-slate-400">Hayır</td>
                        <td className="py-3 px-4 text-slate-300">Oturum ID (context için)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-white mt-8 mb-4">Response</h3>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <pre className="p-4 text-sm overflow-x-auto">
{`{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "deepseek-v3",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "def hello():\\n    print('Hello!')"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 20,
    "total_tokens": 70
  }
}`}
                  </pre>
                </div>
              </section>

              {/* Errors */}
              <section id="errors">
                <h2 className="text-2xl font-bold text-white mb-4">Error Codes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Code</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-red-400">401</td>
                        <td className="py-3 px-4 text-slate-300">Geçersiz veya eksik API key</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-red-400">429</td>
                        <td className="py-3 px-4 text-slate-300">Rate limit aşıldı</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-red-400">500</td>
                        <td className="py-3 px-4 text-slate-300">Sunucu hatası</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-3 px-4 font-mono text-red-400">503</td>
                        <td className="py-3 px-4 text-slate-300">Servis geçici olarak kullanılamıyor</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
