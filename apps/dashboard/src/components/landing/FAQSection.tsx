"use client";

import { useState } from "react";

export function FAQSection() {
  const faqs = [
    {
      question: "How does 3-stage routing work?",
      answer: "CodexFlow automatically analyzes your request and routes it to the optimal AI model. Planning tasks go to Claude for superior reasoning, coding tasks to DeepSeek for cost-effective code generation, and review tasks to GPT-4o-mini for fast feedback. You can also manually specify the stage using the X-CFX-Stage header.",
    },
    {
      question: "Is CodexFlow compatible with my existing code?",
      answer: "Yes! CodexFlow is fully OpenAI API compatible. Just change your base URL from api.openai.com to api.codexflow.dev and you're ready to go. No code changes required.",
    },
    {
      question: "How much can I save compared to using OpenAI directly?",
      answer: "Most users see 50-70% cost savings. By routing coding tasks to DeepSeek and review tasks to GPT-4o-mini, you get the same quality results at a fraction of the cost. Premium models like Claude are only used when truly needed.",
    },
    {
      question: "What happens if a model provider goes down?",
      answer: "CodexFlow has built-in circuit breakers and automatic fallbacks. If Claude is unavailable, we automatically route to Gemini Pro. If DeepSeek is down, we fall back to GPT-4o-mini. Your requests always get processed.",
    },
    {
      question: "Is my code secure?",
      answer: "Absolutely. We're SOC2 compliant, all data is encrypted at rest and in transit, and we never store your prompts or responses beyond what's needed for logging. You can also disable logging entirely.",
    },
    {
      question: "Can I use CodexFlow with the VS Code extension?",
      answer: "Yes! Our CodeFlow Agent extension for VS Code integrates directly with CodexFlow. It automatically detects the context of your work and routes requests to the appropriate stage. Install it from the VS Code marketplace.",
    },
    {
      question: "Do you offer enterprise plans?",
      answer: "Yes, we offer custom enterprise plans with dedicated support, custom SLAs, on-premise deployment options, and SSO/SAML integration. Contact our sales team for details.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-4 bg-slate-900/50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="text-xl text-slate-400">
            Everything you need to know about CodexFlow
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-medium text-white pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
