"use client";

import Link from "next/link";
import { useState } from "react";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out CodexFlow",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "100 requests/day",
        "1 concurrent stream",
        "Community support",
        "Basic analytics",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Starter",
      description: "For individual developers",
      monthlyPrice: 19,
      yearlyPrice: 190,
      features: [
        "1,000 requests/day",
        "3 concurrent streams",
        "Email support",
        "Advanced analytics",
        "API key management",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Pro",
      description: "For professional developers",
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [
        "10,000 requests/day",
        "10 concurrent streams",
        "Priority support",
        "Full analytics suite",
        "Custom model routing",
        "Webhook integrations",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Team",
      description: "For development teams",
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        "Unlimited requests",
        "Unlimited streams",
        "24/7 dedicated support",
        "Team management",
        "SSO & SAML",
        "Custom SLA",
        "On-premise option",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 bg-slate-800 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                !annual ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                annual ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Annual <span className="text-green-400 ml-1">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-slate-800/50 border rounded-2xl p-6 ${
                plan.popular
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-slate-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ${annual ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                </span>
                <span className="text-slate-400">/month</span>
                {annual && plan.yearlyPrice > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    Billed ${plan.yearlyPrice}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Team" ? "/contact" : "/register"}
                className={`block w-full text-center py-3 rounded-xl font-medium transition ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
