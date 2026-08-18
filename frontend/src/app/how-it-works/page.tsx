"use client";

import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Database,
  Zap,
  FileText,
  Lock,
  Scale,
  LineChart,
  Cpu,
  Building2,
  Table,
  Presentation,
  FileCode,
  CheckCircle2,
  Key,
  Server,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export default function HowItWorksPage() {
  const pipelineStages = [
    {
      step: "01",
      title: "Direct-to-S3 Ingestion",
      desc: "Client requests presigned upload URLs directly from FastAPI. Raw bytes upload directly to private AWS S3, bypassing web proxy bottlenecks.",
      icon: Layers,
    },
    {
      step: "02",
      title: "Layout-Aware Structural Parsing",
      desc: "Background tasks parse documents while preserving layout anchors: PDF page numbers, Word headings, Excel sheet tabs, and PowerPoint slide indices.",
      icon: FileText,
    },
    {
      step: "03",
      title: "Vector Embeddings & Tenant Isolation",
      desc: "Text is chunked into 1000-character blocks with overlap, transformed into 384-dimensional dense vectors via SentenceTransformers, and stored in isolated ChromaDB collections.",
      icon: Database,
    },
    {
      step: "04",
      title: "Grounded LLM Synthesis & Streaming",
      desc: "ChromaDB cosine retrieval fetches top matches. Groq Llama 3 synthesizes answers streamed via SSE with verifiable citation metadata.",
      icon: Zap,
    },
  ];

  const useCases = [
    {
      icon: Scale,
      title: "Legal & Compliance",
      subtitle: "Contract auditing, liability review, and regulatory clauses",
      desc: "Accelerate agreement review by asking direct questions across NDAs, MSAs, and vendor contracts. Locate governing law clauses, termination notice periods, and liability caps in seconds.",
      examples: [
        "What are our indemnification obligations in Vendor_Agreement_2024.pdf?",
        "List all contracts with auto-renewal notice periods under 30 days.",
        "Compare Section 4 (IP Assignment) across Version 1 and Version 2.",
      ],
    },
    {
      icon: LineChart,
      title: "Finance & Operations",
      subtitle: "Balance sheet analysis, quarterly reports, and budget variance",
      desc: "Cross-reference multi-tab Excel models and PDF investor updates. Extract EBITDA figures, operational expense ratios, and revenue breakdowns without manual cell hunting.",
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
      desc: "Give engineering teams instant access to system specifications, database schemas, and migration runbooks. BetterBee indexes Markdown and technical specs seamlessly.",
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
      desc: "Empower employees to self-serve answers regarding healthcare benefits, PTO policies, travel expense limits, and security guidelines through natural conversation.",
      examples: [
        "What is the maximum reimbursement for home office equipment?",
        "What are the steps to request parental leave under Employee_Handbook.pdf?",
        "What is the standard procedure for reporting security vulnerabilities?",
      ],
    },
  ];

  const formats = [
    {
      ext: ".pdf",
      name: "PDF Documents",
      engine: "pypdf",
      icon: FileText,
      desc: "Extracts textual content while tracking individual page boundaries. Handles complex multi-page reports, legal filings, and whitepapers.",
      features: [
        "Page-level citation attribution",
        "Header/footer filtering",
        "Multi-column text flow support",
      ],
    },
    {
      ext: ".docx",
      name: "Microsoft Word",
      engine: "python-docx",
      icon: FileText,
      desc: "Parses headings, paragraph hierarchies, bulleted lists, and embedded tables from Word (.docx) specifications and contracts.",
      features: [
        "Section & heading preservation",
        "Embedded table cell extraction",
        "Footnote and bullet list parsing",
      ],
    },
    {
      ext: ".xlsx",
      name: "Excel Spreadsheets",
      engine: "openpyxl",
      icon: Table,
      desc: "Iterates across all worksheet tabs, formatting rows and tabular cell grids into clean Markdown tables suitable for LLM reasoning.",
      features: [
        "Multi-sheet name preservation",
        "Header-row schema mapping",
        "Numerical cell formatting retention",
      ],
    },
    {
      ext: ".pptx",
      name: "PowerPoint Presentations",
      engine: "python-pptx",
      icon: Presentation,
      desc: "Extracts text boxes, slide titles, bullet hierarchies, and presenter speaker notes from presentation decks.",
      features: [
        "Slide-number indexing",
        "Slide title semantic grouping",
        "Speaker note text extraction",
      ],
    },
    {
      ext: ".md",
      name: "Markdown",
      engine: "native utf-8 parser",
      icon: FileCode,
      desc: "Preserves GitHub-flavored Markdown formatting, fenced code snippets, callout blocks, and structural table grids.",
      features: [
        "Heading outline preservation",
        "Fenced code block grouping",
        "Link & footnote retention",
      ],
    },
    {
      ext: ".txt",
      name: "Plain Text & Logs",
      engine: "native utf-8 parser",
      icon: FileText,
      desc: "Fast ingestion of standard plain text, logs, configuration files, and transcribed audio/meeting transcripts.",
      features: [
        "Chunk overlap continuity",
        "UTF-8 / ASCII compatibility",
        "Fast zero-overhead parsing",
      ],
    },
  ];

  const securityPillars = [
    {
      icon: Lock,
      title: "Zero Model Training",
      desc: "Your uploaded documents, indexed vector embeddings, and conversation histories are strictly your property. BetterBee never contributes customer data to public AI training datasets or third-party corpuses.",
    },
    {
      icon: Database,
      title: "Tenant-Isolated Vector Collections",
      desc: "Embeddings in ChromaDB are segregated by workspace identifiers. Vector similarity queries are restricted to the selected workspace boundary, mathematically preventing cross-tenant information bleed.",
    },
    {
      icon: Server,
      title: "Private AWS S3 Storage & Encryption",
      desc: "Uploaded files reside directly in your private AWS S3 bucket. All transfers utilize TLS 1.3 in transit and AWS SSE-S3 256-bit encryption at rest. Pre-signed upload URLs expire within 60 minutes.",
    },
    {
      icon: Key,
      title: "Clerk JWT Authentication & JWKS Caching",
      desc: "Every API request is authenticated via JSON Web Tokens (JWT) verified against Clerk's cryptographically signed public keys. Fast local JWKS caching ensures zero verification network bottlenecks.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121316] text-[#eaebee] selection:bg-[#2b2d38] selection:text-[#f4f4f6]">
      <PublicNav />

      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-24">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#d48b38]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d48b38]" />
            Complete Platform Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f4f4f6]">
            How BetterBee Works Under the Hood
          </h1>
          <p className="text-sm sm:text-base text-[#9fa2b4] leading-relaxed">
            A comprehensive overview of our retrieval-augmented generation pipeline, supported file formats, industry applications, and security guarantees.
          </p>
        </div>

        {/* SECTION 1: Pipeline Architecture */}
        <section id="pipeline" className="space-y-12 scroll-mt-32">
          <div className="space-y-1 border-b border-[#23252d] pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">Section 01</span>
            <h2 className="text-2xl font-medium text-[#f4f4f6]">The Ingestion & Retrieval Pipeline</h2>
            <p className="text-xs text-[#8b8e9b]">End-to-end data lifecycle from raw document upload to cited streaming generation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {pipelineStages.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#6c6f80]">
                  <item.icon className="h-4 w-4 text-[#d48b38]" />
                  <span>{item.step}</span>
                </div>
                <h3 className="text-sm font-medium text-[#eaebee]">{item.title}</h3>
                <p className="text-xs text-[#8b8e9b] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Detailed Ingestion & Execution Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs sm:text-sm text-[#9fa2b4] leading-relaxed">
            <div className="space-y-4">
              <h3 className="text-base font-medium text-[#eaebee]">Preserving Structural Truth</h3>
              <p>
                Unlike basic search systems that concatenate entire documents into flat text, BetterBee&apos;s parsing engine retains coordinate anchors:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-[#8b8e9b]">
                <li><strong>Page Numbers:</strong> Injected into chunk metadata during PDF page extraction.</li>
                <li><strong>Slide Indices:</strong> Tagged on PowerPoint shapes and slide notes.</li>
                <li><strong>Sheet & Row Keys:</strong> Formatted into structured Markdown tables from Excel workbooks.</li>
                <li><strong>Recursive Chunking:</strong> 1,000 characters per chunk with 200-character overlaps to prevent split definitions.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#14151a] p-4 font-mono text-xs text-[#8b8e9b] space-y-3">
              <div className="text-[#6c6f80] border-b border-[#23252d] pb-2 font-semibold">
                Execution Flow & Latency Budget (~420ms total)
              </div>
              <div className="space-y-1 text-[#b0b3c1]">
                <div className="flex justify-between"><span>1. Client Query & Auth Verification:</span> <span className="font-mono text-[#eaebee]">15 ms</span></div>
                <div className="flex justify-between"><span>2. ChromaDB Dense Vector Search:</span> <span className="font-mono text-[#eaebee]">45 ms</span></div>
                <div className="flex justify-between"><span>3. Context Assembly & Prompt Injection:</span> <span className="font-mono text-[#eaebee]">8 ms</span></div>
                <div className="flex justify-between"><span>4. Groq TTFT (Time to First Token):</span> <span className="font-mono text-[#eaebee]">110 ms</span></div>
                <div className="flex justify-between"><span>5. SSE Token Streaming & Citations:</span> <span className="font-mono text-[#eaebee]">242 ms</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Use Cases */}
        <section id="use-cases" className="space-y-8 scroll-mt-32">
          <div className="space-y-1 border-b border-[#23252d] pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">Section 02</span>
            <h2 className="text-2xl font-medium text-[#f4f4f6]">Enterprise Industry Use Cases</h2>
            <p className="text-xs text-[#8b8e9b]">How legal, finance, engineering, and operations teams leverage BetterBee daily.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-[#eaebee]">{item.title}</h3>
                    <span className="text-[11px] text-[#6c6f80]">{item.subtitle}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#9fa2b4] leading-relaxed">
                  {item.desc}
                </p>

                <div className="space-y-2 pt-2 border-t border-[#23252d]">
                  <span className="text-[11px] font-mono text-[#6c6f80] uppercase tracking-wider block">
                    Example Questions:
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
        </section>

        {/* SECTION 3: Supported Formats */}
        <section id="formats" className="space-y-8 scroll-mt-32">
          <div className="space-y-1 border-b border-[#23252d] pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">Section 03</span>
            <h2 className="text-2xl font-medium text-[#f4f4f6]">Supported Document Formats</h2>
            <p className="text-xs text-[#8b8e9b]">Native parsers built for structural extraction without information loss.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {formats.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-[#d48b38]" />
                    <h3 className="text-sm font-medium text-[#eaebee]">{item.name}</h3>
                  </div>
                  <span className="font-mono text-xs text-[#d48b38] bg-[#14151a] px-2 py-0.5 rounded border border-[#272935]">
                    {item.ext}
                  </span>
                </div>

                <p className="text-xs text-[#8b8e9b] leading-relaxed">
                  {item.desc}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#23252d] text-xs">
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5 text-[#b0b3c1]">
                      <CheckCircle2 className="h-3 w-3 text-[#d48b38] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Security & Compliance */}
        <section id="security" className="space-y-8 scroll-mt-32">
          <div className="space-y-1 border-b border-[#23252d] pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">Section 04</span>
            <h2 className="text-2xl font-medium text-[#f4f4f6]">Security & Data Governance</h2>
            <p className="text-xs text-[#8b8e9b]">Guaranteed tenant isolation, zero model training, and private cloud storage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityPillars.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-[#eaebee]">{item.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#9fa2b4] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Specifications Matrix */}
          <div className="rounded-lg border border-[#23252d] bg-[#18191f] overflow-hidden">
            <div className="border-b border-[#23252d] px-5 py-3 bg-[#15161b]">
              <h3 className="text-xs font-medium text-[#eaebee]">Infrastructure & Security Specifications</h3>
            </div>
            <div className="divide-y divide-[#23252d] text-xs">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-medium text-[#b0b3c1]">Data at Rest</span>
                <span className="sm:col-span-2 text-[#9fa2b4]">AWS S3 AES-256 server-side encryption & PostgreSQL encryption</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-medium text-[#b0b3c1]">Data in Transit</span>
                <span className="sm:col-span-2 text-[#9fa2b4]">Enforced TLS 1.3 for all REST endpoints, SSE streams, and S3 direct uploads</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-medium text-[#b0b3c1]">Authentication Layer</span>
                <span className="sm:col-span-2 text-[#9fa2b4]">Clerk OAuth / SSO with JWT session tokens and short-lived JWKS signatures</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="font-medium text-[#b0b3c1]">Vector Storage Isolation</span>
                <span className="sm:col-span-2 text-[#9fa2b4]">ChromaDB collection per-workspace partitioning with strict foreign-key verification</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-[#23252d] bg-[#18191f] p-8 sm:p-12 text-center space-y-4">
          <h2 className="text-2xl font-medium tracking-tight text-[#f4f4f6]">
            Start Searching Your Documents Today
          </h2>
          <p className="text-xs sm:text-sm text-[#8b8e9b] max-w-lg mx-auto">
            Create your first workspace, upload company documentation, and start receiving grounded answers in minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] rounded-md transition-colors shadow-xs cursor-pointer"
            >
              Open Workspaces <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
