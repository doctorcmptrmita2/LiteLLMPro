import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodexFlow - 3-Stage AI Orchestration Platform",
  description: "Intelligent AI routing platform. Plan with Claude, Code with DeepSeek, Review with GPT-4o-mini.",
  keywords: "AI, LLM, API, Claude, GPT, DeepSeek, AI orchestration, code generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
