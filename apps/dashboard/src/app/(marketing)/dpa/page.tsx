import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Data Processing Agreement (DPA)</h1>
          <p className="text-slate-400 mb-12">Last updated: January 2, 2026</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                This Data Processing Agreement ("DPA") governs the personal data processing relationship 
                between CodexFlow Platform ("Data Processor") and the customer using our services ("Data Controller").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
                <li><strong>Processing:</strong> Any operation performed on personal data</li>
                <li><strong>Data Controller:</strong> The party that determines the purposes of data processing</li>
                <li><strong>Data Processor:</strong> The party that processes data on behalf of the controller</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Scope of Processing</h2>
              <p className="mb-4">CodexFlow processes the following personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (email, name)</li>
                <li>API usage data</li>
                <li>Technical logs (IP address, user agent)</li>
                <li>Payment information (processed by Stripe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Processor Obligations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process data only for specified purposes</li>
                <li>Implement appropriate technical and organizational security measures</li>
                <li>Use sub-processors only with written consent</li>
                <li>Notify data breaches within 72 hours</li>
                <li>Allow audits</li>
                <li>Delete or return data at contract termination</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Sub-Processors</h2>
              <p className="mb-4">The following sub-processors are used:</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">Sub-Processor</th>
                      <th className="text-left py-3 px-4 text-slate-400">Purpose</th>
                      <th className="text-left py-3 px-4 text-slate-400">Location</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">OpenRouter</td>
                      <td className="py-3 px-4">AI API Gateway</td>
                      <td className="py-3 px-4">USA</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">Stripe</td>
                      <td className="py-3 px-4">Payment processing</td>
                      <td className="py-3 px-4">USA</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">Hetzner</td>
                      <td className="py-3 px-4">Hosting</td>
                      <td className="py-3 px-4">Germany</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. International Transfers</h2>
              <p>
                Personal data may be transferred outside the EU/EEA. In such cases, Standard Contractual 
                Clauses (SCC) or other appropriate safeguards are used.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Subject Rights</h2>
              <p>
                We assist data subjects in exercising their rights to access, rectification, 
                deletion, and portability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
              <p>
                For DPA-related questions: {" "}
                <a href="mailto:dpo@codexflow.dev" className="text-blue-400 hover:text-blue-300">dpo@codexflow.dev</a>
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Sign a DPA</h3>
            <p className="text-slate-400 text-sm mb-4">
              We provide signed DPAs for enterprise customers. Click the button below to request one.
            </p>
            <a
              href="mailto:legal@codexflow.dev?subject=DPA Request"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
            >
              Request DPA
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
