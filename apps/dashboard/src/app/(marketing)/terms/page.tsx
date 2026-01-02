import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-slate-400 mb-12">Last updated: January 2, 2026</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Service Description</h2>
              <p>
                CodexFlow Platform is an API orchestration service that provides access to artificial intelligence models. 
                Our service allows you to use different AI models through a single API.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Account Creation</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and current information</li>
                <li>You are responsible for your account security</li>
                <li>You must keep your API keys confidential</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Acceptable Use</h2>
              <p className="mb-4">When using our service, you may NOT:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generate or distribute illegal content</li>
                <li>Create malware or spam</li>
                <li>Violate the rights of others</li>
                <li>Abuse or overload the service</li>
                <li>Share or sell API keys</li>
                <li>Attempt to bypass rate limits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Payment and Billing</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Paid plans are billed monthly or annually</li>
                <li>Payments are processed securely through Stripe</li>
                <li>Subscriptions auto-renew until cancelled</li>
                <li>Unused credits are non-refundable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Service Level</h2>
              <p>
                We target 99.9% uptime but do not guarantee it. Scheduled maintenance will be announced in advance. 
                We are not liable for damages resulting from service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The CodexFlow brand and logo belong to us</li>
                <li>Content you generate through the API belongs to you</li>
                <li>AI model outputs are subject to the respective provider's terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p>
                Our service is provided "as is". We are not liable for indirect, incidental, or consequential damages. 
                Our total liability is limited to the amount you paid in the last 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Account Termination</h2>
              <p>
                We may suspend or terminate your account if you violate these terms. 
                You may close your account at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes</h2>
              <p>
                We reserve the right to modify these terms without prior notice. 
                Significant changes will be communicated via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
              <p>
                For questions: <a href="mailto:legal@codexflow.dev" className="text-blue-400 hover:text-blue-300">legal@codexflow.dev</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
