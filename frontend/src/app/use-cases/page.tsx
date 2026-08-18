"use client";

import Link from "next/link";
import { ArrowRight, Scale, LineChart, Cpu, Building2 } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export default function UseCasesPage() {
  const cases = [
    {
      icon: Scale,
      title: "Legal & Compliance Teams",
      subtitle: "Contract auditing, liability review, and regulatory compliance",
      desc: "Accelerate agreement review by asking direct questions across NDAs, MSAs, and employment contracts. Locate governing law clauses, termination obligations, and liability caps instantly.",
      examples: [
        "What are our indemnification obligations in the Vendor_Agreement_2024.pdf?",
        "List all contracts with auto-renewal notice periods under 30 days.",
        "Compare Section 4 (IP Assignment) across Version 1 and Version 2.",
      ],
    },
    {
      icon: LineChart,
      title: "Finance & Operations",
      subtitle: "Balance sheet analysis, quarterly reports, and budget variance",
      desc: "Cross-reference multi-tab Excel models and PDF investor updates. Extract precise EBITDA figures, operational expense ratios, and revenue breakdowns without manual cell hunting.",
      examples: [
        "What was the operating profit margin variance between Q2 and Q3?",
        "Extract the capital expenditure table from FY24_Budget.xlsx.",
        "Summarize all risk factors listed in the annual audit report.",
      ],
    },
    {
      icon: Cpu,
      title: "Engineering & Architecture",
      subtitle: "Technical specifications, API docs, and architecture RFCs",
      desc: "Give engineering teams instant access to system specifications, database schemas, and migration runbooks. BetterBee indexes Markdown and code-adjacent documentation seamlessly.",
      examples: [
        "What is the required authentication header format for the Payments API?",
        "Find the disaster recovery failover steps in Infrastructure_Runbook.md.",
        "Which database tables contain customer billing metadata?",
      ],
    },
    {
      icon: Building2,
      title: "HR & Employee Onboarding",
      subtitle: "Company policies, employee handbooks, and standard procedures",
      desc: "Empower employees to self-serve answers regarding healthcare benefits, PTO policies, travel expense limits, and security training guidelines through natural conversation.",
      examples: [
        "What is the maximum reimbursement for home office equipment?",
        "What are the steps to request parental leave under Employee_Handbook.pdf?",
        "What is the standard procedure for reporting security vulnerabilities?",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#121316] text-[#eaebee] selection:bg-[#2b2d38] selection:text-[#f4f4f6]">
      <PublicNav />

      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#d48b38]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d48b38]" />
            Enterprise Applications
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f4f4f6]">
            Built for Knowledge-Dense Organizations
          </h1>
          <p className="text-sm sm:text-base text-[#9fa2b4] leading-relaxed">
            See how teams across legal, finance, engineering, and operations use BetterBee to eliminate repetitive document search.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-[#eaebee]">{item.title}</h2>
                  <span className="text-[11px] text-[#6c6f80]">{item.subtitle}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#9fa2b4] leading-relaxed">
                {item.desc}
              </p>

              <div className="space-y-2 pt-2 border-t border-[#23252d]">
                <span className="text-[11px] font-mono text-[#6c6f80] uppercase tracking-wider block">
                  Example Queries:
                </span>
                <div className="space-y-1.5">
                  {item.examples.map((ex, eIdx) => (
                    <div key={eIdx} className="text-xs text-[#b0b3c1] bg-[#14151a] p-2 rounded border border-[#23252d] font-mono">
                      &ldquo;{ex}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-[#23252d] bg-[#18191f] p-8 text-center space-y-4">
          <h2 className="text-xl font-medium text-[#f4f4f6]">
            Start organizing your documents into workspaces
          </h2>
          <p className="text-xs text-[#8b8e9b] max-w-md mx-auto">
            Set up a dedicated workspace for your department or project in under a minute.
          </p>
          <div className="pt-2">
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] rounded-md transition-colors"
            >
              Launch Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
