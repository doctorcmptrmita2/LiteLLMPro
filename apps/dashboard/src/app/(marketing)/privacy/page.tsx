import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 mb-12">Last updated: January 2, 2026</p>

          <div className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-8 text-slate-300">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                <p>
                  At CodexFlow Platform ("we", "our"), we respect your privacy. This policy explains 
                  what information we collect when you use our services and how we use it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Email, name, password (hashed)</li>
                  <li><strong>Usage Data:</strong> API calls, token usage, request logs</li>
                  <li><strong>Technical Data:</strong> IP address, browser info, device type</li>
                  <li><strong>Payment Information:</strong> Processed by Stripe, we don't store card details</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Data</h2>
                <p>We use the collected data for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>To provide and improve our services</li>
                  <li>To manage and secure your account</li>
                  <li>For billing and payment processing</li>
                  <li>To provide technical support</li>
                  <li>To fulfill legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
                <p>
                  We use industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>TLS/SSL encryption</li>
                  <li>Password hashing with bcrypt</li>
                  <li>API key hashing with SHA-256</li>
                  <li>Regular security audits</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
                <p>
                  We retain your data as long as your account is active. When you request account deletion, 
                  your data will be permanently deleted within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Third Parties</h2>
                <p>We may share your data with the following third parties:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>AI Providers:</strong> OpenRouter, Anthropic, OpenAI (for API requests)</li>
                  <li><strong>Payment:</strong> Stripe (for payment processing)</li>
                  <li><strong>Analytics:</strong> Anonymous usage statistics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
                <p>Under GDPR and similar regulations, you have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Right to access your data</li>
                  <li>Right to rectify your data</li>
                  <li>Right to delete your data</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
                <p>
                  For privacy-related questions: <a href="mailto:privacy@codexflow.dev" className="text-blue-400 hover:text-blue-300">privacy@codexflow.dev</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
