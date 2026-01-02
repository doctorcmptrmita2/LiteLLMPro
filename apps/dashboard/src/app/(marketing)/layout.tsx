import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CodexFlow Platform - 3-Stage AI Orchestration",
  description: "Intelligent AI routing platform that automatically selects the best model for each task. Plan with Claude, Code with DeepSeek, Review with GPT-4o-mini.",
  keywords: "AI, LLM, API, Claude, GPT, DeepSeek, AI orchestration, code generation, AI routing",
  openGraph: {
    title: "CodexFlow Platform - 3-Stage AI Orchestration",
    description: "Intelligent AI routing platform that automatically selects the best model for each task.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
