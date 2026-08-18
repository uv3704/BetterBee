"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  Table,
  Presentation,
  FileCode,
  ShieldCheck,
  Building2,
  Scale,
  LineChart,
  Cpu,
  CheckCircle2,
  Lock,
  Zap,
  ExternalLink,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "search" | "sources">("chat");
  const [cvTab, setCvTab] = useState<"experience" | "skills" | "education">("experience");

  // Pre-warm backend on page load
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/v1/health`).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#121316] text-[#eaebee] selection:bg-[#2b2d38] selection:text-[#f4f4f6]">
      <PublicNav />

      <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 pt-12 pb-20 space-y-20">
        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#23252d] bg-[#18191f] text-xs font-medium text-[#9fa2b4]">
            <Lock className="h-3 w-3 text-[#d48b38]" />
            <span>Production Document Intelligence for Teams</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f4f4f6] leading-[1.2]">
            Turn company documents into an instant, verifiable AI knowledge base.
          </h1>

          <p className="text-sm sm:text-base text-[#9fa2b4] leading-relaxed pt-1 max-w-3xl">
            BetterBee indexes your organization&apos;s reports, contracts, spreadsheets, and slide decks into private vector stores. Query thousands of pages simultaneously and receive factual answers with exact page, sheet, and slide citations.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/workspaces"
              className="px-4 py-2.5 text-xs sm:text-sm font-medium bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] rounded-md transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              Get Started Free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="px-4 py-2.5 text-xs sm:text-sm font-medium bg-[#18191f] hover:bg-[#1f212a] text-[#b0b3c1] hover:text-[#eaebee] border border-[#272935] rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              How It Works &amp; Specs <ArrowRight className="h-3.5 w-3.5 text-[#8b8e9b]" />
            </Link>
          </div>
        </section>

        {/* Live Interactive Product Demonstration */}
        <section className="rounded-lg border border-[#23252d] bg-[#18191f] overflow-hidden">
          <div className="border-b border-[#23252d] px-4 py-3 flex items-center justify-between bg-[#15161b] text-xs">
            <div className="flex items-center gap-2 text-[#8b8e9b]">
              <span className="font-mono text-[11px] text-[#6c6f80]">workspace &mdash;</span>
              <span className="text-[#b0b3c1] font-medium">Enterprise_Procurement_2024</span>
            </div>

            <div className="flex items-center gap-1 bg-[#121316] p-0.5 rounded border border-[#23252d]">
              {(["chat", "search", "sources"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-[11px] capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-[#23252d] text-[#f4f4f6] font-medium"
                      : "text-[#8b8e9b] hover:text-[#eaebee]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 text-xs sm:text-sm space-y-4">
            {activeTab === "chat" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded bg-[#272935] flex items-center justify-center text-[10px] font-semibold text-[#8b8e9b] shrink-0">
                    Q
                  </div>
                  <div className="text-[#b0b3c1] pt-0.5 font-medium">
                    What is our termination clause penalty and what notice period is required under Master_Service_Agreement.pdf?
                  </div>
                </div>

                <div className="flex items-start gap-3 pl-0 sm:pl-9">
                  <div className="rounded-md border border-[#272935] bg-[#14151a] p-4 text-[#c7cad6] space-y-3 leading-relaxed max-w-3xl">
                    <p>
                      According to <strong>Section 8.2 (Termination for Convenience)</strong> of the Master Services Agreement:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[#9fa2b4] text-xs">
                      <li>
                        <strong>Notice Period:</strong> Either party may terminate without cause by providing at least <strong>60 calendar days written notice</strong>.
                      </li>
                      <li>
                        <strong>Penalty Structure:</strong> Early termination within the initial 12-month commitment incurs an early exit fee equal to <strong>50% of the remaining contracted monthly recurring revenue</strong>.
                      </li>
                    </ul>

                    <div className="pt-2.5 border-t border-[#23252d] flex flex-wrap items-center gap-2 text-[11px] text-[#8b8e9b]">
                      <span className="text-[#6c6f80]">Grounded Citations:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c1e27] border border-[#2c2e3a] text-[#b0b3c1]">
                        <FileText className="h-3 w-3 text-[#d48b38]" /> Master_Service_Agreement.pdf &middot; Page 14 (Section 8.2)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c1e27] border border-[#2c2e3a] text-[#b0b3c1]">
                        <Table className="h-3 w-3 text-[#d48b38]" /> Rate_Card_Schedule_B.xlsx &middot; Sheet: Fee Schedule
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded border border-[#272935] bg-[#121316] px-3 py-2 text-xs text-[#b0b3c1]">
                  <Search className="h-3.5 w-3.5 text-[#6c6f80]" />
                  <span>termination fee early exit penalty 60 days notice</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded border border-[#23252d] bg-[#14151a] p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#eaebee]">Master_Service_Agreement.pdf</span>
                      <span className="text-[#6c6f80] font-mono text-[11px]">96% Match &middot; Page 14</span>
                    </div>
                    <p className="text-xs text-[#8b8e9b] leading-normal">
                      &ldquo;8.2 Termination for Convenience. Client may terminate this Agreement upon sixty (60) days prior written notice, subject to early termination fees set forth in Schedule B...&rdquo;
                    </p>
                  </div>
                  <div className="rounded border border-[#23252d] bg-[#14151a] p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#eaebee]">Rate_Card_Schedule_B.xlsx</span>
                      <span className="text-[#6c6f80] font-mono text-[11px]">88% Match &middot; Sheet 1</span>
                    </div>
                    <p className="text-xs text-[#8b8e9b] leading-normal">
                      &ldquo;Row 42: Early Termination Fee = 50% * Remaining Monthly Minimum Commitment Balance.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sources" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded border border-[#23252d] bg-[#14151a] p-3.5 space-y-1.5">
                  <div className="font-medium text-[#eaebee]">Master_Service_Agreement.pdf</div>
                  <div className="text-[#6c6f80]">Document ID: doc_7fa82 &middot; Page 14 &middot; Chunk 48</div>
                  <div className="text-[11px] text-[#9fa2b4] bg-[#18191f] p-2 rounded border border-[#23252d]">
                    Contains termination definitions, notice periods, and dispute resolution terms.
                  </div>
                </div>
                <div className="rounded border border-[#23252d] bg-[#14151a] p-3.5 space-y-1.5">
                  <div className="font-medium text-[#eaebee]">Rate_Card_Schedule_B.xlsx</div>
                  <div className="text-[#6c6f80]">Document ID: doc_3bc19 &middot; Sheet: Fee Schedule</div>
                  <div className="text-[11px] text-[#9fa2b4] bg-[#18191f] p-2 rounded border border-[#23252d]">
                    Contains fee structures, billing rates, and multiplier formulas.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 1: What BetterBee Can Do (Core Platform Capabilities) */}
        <section id="capabilities" className="space-y-8 pt-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">
              Platform Capabilities
            </span>
            <h2 className="text-2xl font-medium tracking-tight text-[#f4f4f6]">
              What BetterBee Does for Your Organization
            </h2>
            <p className="text-xs sm:text-sm text-[#8b8e9b] max-w-2xl">
              Eliminate hours of manual document review. BetterBee acts as a reliable, always-available intelligence layer on top of your files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-5 space-y-3">
              <div className="h-8 w-8 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                <Search className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium text-[#eaebee]">
                Natural Language Semantic Search
              </h3>
              <p className="text-[#8b8e9b] leading-relaxed">
                Find concepts, clauses, numbers, and technical requirements across thousands of pages even when you don&apos;t remember the exact keyword.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-5 space-y-3">
              <div className="h-8 w-8 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium text-[#eaebee]">
                Grounded Q&A with Citations
              </h3>
              <p className="text-[#8b8e9b] leading-relaxed">
                Ask specific questions and get synthesized answers that cite the exact page number, spreadsheet row, or slide for full verification.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-5 space-y-3">
              <div className="h-8 w-8 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium text-[#eaebee]">
                Multi-Department Workspaces
              </h3>
              <p className="text-[#8b8e9b] leading-relaxed">
                Create dedicated workspaces for Legal, Finance, HR, or client accounts with isolated vector collections and strict permission boundaries.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How It Works (The 4-Step Technical Architecture) */}
        <section id="how-it-works" className="space-y-8 pt-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">
              Under The Hood
            </span>
            <h2 className="text-2xl font-medium tracking-tight text-[#f4f4f6]">
              How BetterBee Works Under the Hood
            </h2>
            <p className="text-xs sm:text-sm text-[#8b8e9b] max-w-2xl">
              A transparent, production-grade retrieval-augmented generation (RAG) pipeline designed for low resource overhead and zero hallucinations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                icon: Layers,
                title: "1. Ingestion & Structural Parsing",
                desc: "Uploaded files are stored directly in private AWS S3. Background parsers extract formatted text while maintaining exact page numbers, slide indexes, and sheet coordinates.",
              },
              {
                step: "02",
                icon: Database,
                title: "2. Chunking & Local Embeddings",
                desc: "Documents are split into contextual chunks with overlap. Semantic embeddings are computed via sentence-transformers and indexed into local ChromaDB collections.",
              },
              {
                step: "03",
                icon: Search,
                title: "3. Vector Search & Reranking",
                desc: "When a query is submitted, ChromaDB performs cosine similarity search within the target workspace. Top matches are scored and filtered for optimal relevance.",
              },
              {
                step: "04",
                icon: Zap,
                title: "4. LLM Synthesis & Streaming",
                desc: "Retrieved context and user prompts are passed to high-speed Groq inference engines (Llama 3.3). Responses stream back in milliseconds with exact citation metadata.",
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#6c6f80] font-mono">
                  <item.icon className="h-4 w-4 text-[#d48b38]" />
                  <span>{item.step}</span>
                </div>
                <h3 className="text-sm font-medium text-[#eaebee]">{item.title}</h3>
                <p className="text-xs text-[#8b8e9b] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs text-[#d48b38] hover:text-[#e5a04e] font-medium transition-colors"
            >
              Read full architecture, latency budget &amp; parser specifications <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Section 3: Enterprise Use Cases */}
        <section id="use-cases" className="space-y-8 pt-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">
              Real-World Applications
            </span>
            <h2 className="text-2xl font-medium tracking-tight text-[#f4f4f6]">
              How Companies Use BetterBee
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#eaebee]">
                <Scale className="h-4 w-4 text-[#d48b38]" />
                <span>Legal & Compliance</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                Review NDAs, MSAs, and vendor agreements. Check indemnity clauses, liability caps, and renewal deadlines in seconds.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#eaebee]">
                <LineChart className="h-4 w-4 text-[#d48b38]" />
                <span>Finance & Operations</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                Query multi-sheet balance sheets, audit reports, and investor updates. Extract margin figures and cost breakdowns accurately.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#eaebee]">
                <Cpu className="h-4 w-4 text-[#d48b38]" />
                <span>Engineering & Product</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                Search architecture specifications, API guidelines, and security policies without sifting through outdated wikis.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[#eaebee]">
                <Building2 className="h-4 w-4 text-[#d48b38]" />
                <span>HR & Employee Onboarding</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                Help new hires find company policies, benefits guides, and standard operating procedures instantly through conversational search.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Universal File Formats */}
        <section id="formats" className="space-y-6 pt-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">
              Format Support
            </span>
            <h2 className="text-2xl font-medium tracking-tight text-[#f4f4f6]">
              Supported Document Formats
            </h2>
            <p className="text-xs text-[#8b8e9b]">
              Parsers extract clean text and metadata across standard file extensions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {[
              { label: "PDF Documents", ext: ".pdf", icon: FileText },
              { label: "Word Documents", ext: ".docx", icon: FileText },
              { label: "Spreadsheets", ext: ".xlsx", icon: Table },
              { label: "Presentations", ext: ".pptx", icon: Presentation },
              { label: "Markdown", ext: ".md", icon: FileCode },
              { label: "Plain Text", ext: ".txt", icon: FileText },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded border border-[#23252d] bg-[#18191f] p-3 text-center space-y-1.5"
              >
                <item.icon className="h-4 w-4 mx-auto text-[#8b8e9b]" />
                <div className="font-mono text-xs font-medium text-[#d48b38]">{item.ext}</div>
                <div className="text-[11px] text-[#6c6f80]">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Security & Infrastructure */}
        <section id="security" className="space-y-6 pt-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#d48b38]">
              Security & Compliance
            </span>
            <h2 className="text-2xl font-medium tracking-tight text-[#f4f4f6]">
              Enterprise-Grade Privacy Controls
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[#eaebee]">
                <ShieldCheck className="h-4 w-4 text-[#d48b38]" />
                <span>Zero Model Training</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                Your documents and vector collections remain strictly your property. No client data is ever used to train external LLMs.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[#eaebee]">
                <CheckCircle2 className="h-4 w-4 text-[#d48b38]" />
                <span>Isolated Vector Collections</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                ChromaDB stores embeddings with dedicated collection prefixes per workspace to eliminate data bleeding between projects.
              </p>
            </div>

            <div className="rounded-lg border border-[#23252d] bg-[#18191f] p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[#eaebee]">
                <CheckCircle2 className="h-4 w-4 text-[#d48b38]" />
                <span>Private AWS S3 Storage</span>
              </div>
              <p className="text-[#8b8e9b] leading-relaxed">
                Direct-to-S3 presigned upload URLs keep file transfers encrypted in transit and at rest with AWS SSE.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Bottom Product Call to Action */}
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
              Open Workspaces Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Glimpse of Portfolio & Curriculum Vitae (yuviii.in) */}
        <section id="portfolio-glimpse" className="pt-2">
          <div className="rounded-2xl border border-[#2b2e3c] bg-[#15171f] p-6 sm:p-8 lg:p-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Hero Editorial Identity */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-[#9fa2b4] uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Open to Work &middot; Mandsaur, MP, India</span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-[#f4f4f6]">
                    I&apos;m Yuvraj.
                  </h2>
                  <p className="text-sm font-medium text-[#dcdfe8] leading-relaxed">
                    Full-Stack Developer leveraging Java, Next.js, FastAPI, and AI/ML to build scalable applications.
                  </p>
                  <p className="text-xs text-[#8b8e9b] leading-relaxed pt-1">
                    I&apos;m a computer science engineering student (AI specialization) and developer based in India. I focus on building production-grade full-stack applications, intelligent multimodal RAG systems, and performant backend services with Java, Python, and TypeScript.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href="https://yuviii.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-[#f4f4f6] hover:bg-white text-[#121316] font-semibold rounded-md transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>VIEW LIVE PORTFOLIO</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://github.com/uv3704"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-[#1e202a] hover:bg-[#272935] text-[#eaebee] border border-[#2e3240] rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="h-3 w-3 text-[#8b8e9b]" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/uv3704/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-[#1e202a] hover:bg-[#272935] text-[#eaebee] border border-[#2e3240] rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3 text-[#8b8e9b]" />
                  </a>
                </div>
              </div>

              {/* Right Column: Interactive Curriculum Vitae Preview */}
              <div className="lg:col-span-7 rounded-xl border border-[#2e3240] bg-[#191b24] shadow-md overflow-hidden text-xs">
                {/* CV Header */}
                <div className="border-b border-[#282b36] px-4 py-3 bg-[#13151c] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d48b38]" />
                    <span className="font-mono text-[10px] tracking-wider text-[#9fa2b4] uppercase">
                      Curriculum Vitae Preview
                    </span>
                  </div>
                  <a
                    href="https://yuviii.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-[#d48b38] hover:text-[#e5a04e] flex items-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    <span>Full Catalog</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {/* Candidate Info Header */}
                <div className="p-4 sm:p-5 border-b border-[#282b36] bg-[#161822] space-y-1 text-center sm:text-left">
                  <h3 className="text-base font-semibold text-[#f4f4f6] font-serif">
                    Yuvraj Singh Rathore
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-[#8b8e9b]">
                    <span>+91 6232394854</span>
                    <span>&middot;</span>
                    <a href="mailto:uv3704@gmail.com" className="text-[#d48b38] hover:underline">
                      uv3704@gmail.com
                    </a>
                    <span>&middot;</span>
                    <span>Mandsaur, MP, India</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b border-[#282b36] bg-[#13151c] px-3">
                  {[
                    { id: "experience", label: "Experience" },
                    { id: "skills", label: "Skills" },
                    { id: "education", label: "Education" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCvTab(tab.id as typeof cvTab)}
                      className={`px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                        cvTab === tab.id
                          ? "border-[#d48b38] text-[#f4f4f6] font-medium"
                          : "border-transparent text-[#6c6f80] hover:text-[#9fa2b4]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-5 space-y-4 min-h-[160px]">
                  {cvTab === "experience" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-0.5">
                          <span className="font-medium text-[#eaebee]">
                            Infosys Springboard <span className="text-[#8b8e9b]">&middot; AI/ML Intern</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#6c6f80]">Oct 2024 – Dec 2024</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#9fa2b4] leading-relaxed">
                          <li>Built CNN model using TensorFlow achieving 97.5% accuracy on 10-class image classification.</li>
                          <li>Reduced model size by 35% using quantization and pruning techniques for efficient deployment.</li>
                        </ul>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#232530]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-0.5">
                          <span className="font-medium text-[#eaebee]">
                            ThrivesUp Consultancy Services <span className="text-[#8b8e9b]">&middot; Java Backend Intern</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#6c6f80]">Jul 2025 – Sep 2025</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#9fa2b4] leading-relaxed">
                          <li>Developed 12+ RESTful API endpoints using Java, Spring patterns, JDBC, and MySQL for academic records.</li>
                          <li>Optimized database queries reducing query response times from 500ms to under 90ms.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {cvTab === "skills" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded border border-[#282b36] bg-[#14151e] p-3 space-y-1">
                        <span className="font-mono text-[10px] text-[#d48b38] uppercase">Languages &amp; Core</span>
                        <p className="text-[11px] text-[#eaebee]">Java, Python, TypeScript, SQL, JavaScript, HTML5/CSS3</p>
                      </div>
                      <div className="rounded border border-[#282b36] bg-[#14151e] p-3 space-y-1">
                        <span className="font-mono text-[10px] text-[#d48b38] uppercase">Full-Stack &amp; Frameworks</span>
                        <p className="text-[11px] text-[#eaebee]">FastAPI, Next.js 15, React 19, Spring Boot, Tailwind CSS</p>
                      </div>
                      <div className="rounded border border-[#282b36] bg-[#14151e] p-3 space-y-1">
                        <span className="font-mono text-[10px] text-[#d48b38] uppercase">AI / ML &amp; Retrieval</span>
                        <p className="text-[11px] text-[#eaebee]">RAG Pipelines, ChromaDB, SentenceTransformers, Groq, PyTorch</p>
                      </div>
                      <div className="rounded border border-[#282b36] bg-[#14151e] p-3 space-y-1">
                        <span className="font-mono text-[10px] text-[#d48b38] uppercase">Databases &amp; Cloud</span>
                        <p className="text-[11px] text-[#eaebee]">AWS S3, PostgreSQL, Redis, Docker, Git, REST APIs</p>
                      </div>
                    </div>
                  )}

                  {cvTab === "education" && (
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#eaebee]">Bachelor of Technology (B.Tech)</span>
                          <span className="font-mono text-[10px] text-[#6c6f80]">2022 – 2026</span>
                        </div>
                        <p className="text-[11px] text-[#d48b38]">Computer Science &amp; Engineering (AI Specialization)</p>
                        <p className="text-[11px] text-[#8b8e9b]">Faculty of Engineering and Technology, Mandsaur University, MP, India</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CV Footer */}
                <div className="border-t border-[#282b36] px-4 py-2.5 bg-[#13151c] flex items-center justify-between text-[10px] text-[#6c6f80] font-mono">
                  <span>Mandsaur, MP, India</span>
                  <a
                    href="https://yuviii.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d48b38] hover:text-[#e5a04e] flex items-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    <span>Full Career &amp; Projects</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
