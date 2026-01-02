import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-slate-400 mb-12">Last updated: January 2, 2026</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
              <p>
                Cookies are small text files that websites store in your browser. 
                They are used for session management, remembering your preferences, and analyzing site usage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">Cookie</th>
                      <th className="text-left py-3 px-4 text-slate-400">Type</th>
                      <th className="text-left py-3 px-4 text-slate-400">Duration</th>
                      <th className="text-left py-3 px-4 text-slate-400">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4 font-mono">session_token</td>
                      <td className="py-3 px-4">Essential</td>
                      <td className="py-3 px-4">Session</td>
                      <td className="py-3 px-4">Authentication</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4 font-mono">csrf_token</td>
                      <td className="py-3 px-4">Essential</td>
                      <td className="py-3 px-4">Session</td>
                      <td className="py-3 px-4">Security</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4 font-mono">preferences</td>
                      <td className="py-3 px-4">Functional</td>
                      <td className="py-3 px-4">1 year</td>
                      <td className="py-3 px-4">User preferences</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4 font-mono">_ga</td>
                      <td className="py-3 px-4">Analytics</td>
                      <td className="py-3 px-4">2 years</td>
                      <td className="py-3 px-4">Google Analytics</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookie Types</h2>
              <ul className="space-y-4">
                <li>
                  <strong className="text-white">Essential Cookies:</strong> Required for the site to function. 
                  Cannot be disabled.
                </li>
                <li>
                  <strong className="text-white">Functional Cookies:</strong> Remember your preferences. 
                  Can be disabled but may affect your experience.
                </li>
                <li>
                  <strong className="text-white">Analytics Cookies:</strong> Help us understand site usage. 
                  Collect anonymous data.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Managing Cookies</h2>
              <p>
                You can delete or block cookies through your browser settings. 
                However, this may cause some site features to not work properly.
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><a href="https://support.google.com/chrome/answer/95647" className="text-blue-400 hover:text-blue-300">Chrome</a></li>
                <li><a href="https://support.mozilla.org/kb/cookies" className="text-blue-400 hover:text-blue-300">Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies" className="text-blue-400 hover:text-blue-300">Safari</a></li>
                <li><a href="https://support.microsoft.com/microsoft-edge/cookies" className="text-blue-400 hover:text-blue-300">Edge</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
              <p>
                For questions about our cookie policy: {" "}
                <a href="mailto:privacy@codexflow.dev" className="text-blue-400 hover:text-blue-300">privacy@codexflow.dev</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
