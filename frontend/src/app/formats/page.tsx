"use client";

import Link from "next/link";
import { ArrowRight, FileText, Table, Presentation, FileCode, CheckCircle2 } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export default function FormatsPage() {
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

  return (
    <div className="min-h-screen bg-[#121316] text-[#eaebee] selection:bg-[#2b2d38] selection:text-[#f4f4f6]">
      <PublicNav />

      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#d48b38]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d48b38]" />
            Format Specifications
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f4f4f6]">
            Universal Document Parsing
          </h1>
          <p className="text-sm sm:text-base text-[#9fa2b4] leading-relaxed">
            BetterBee includes dedicated parser implementations for each major enterprise file format to ensure structural fidelity and precise citation mapping.
          </p>
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {formats.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-[#d48b38]" />
                  <h2 className="text-sm font-medium text-[#eaebee]">{item.name}</h2>
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

        {/* CTA */}
        <div className="rounded-xl border border-[#23252d] bg-[#18191f] p-8 text-center space-y-4">
          <h2 className="text-xl font-medium text-[#f4f4f6]">
            Upload your files and experience structured retrieval
          </h2>
          <p className="text-xs text-[#8b8e9b] max-w-md mx-auto">
            BetterBee automatically identifies file extensions and applies the correct parsing engine.
          </p>
          <div className="pt-2">
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#f4f4f6] hover:bg-[#eaebee] text-[#121316] rounded-md transition-colors"
            >
              Open Workspaces <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
