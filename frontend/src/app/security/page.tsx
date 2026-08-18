"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock, Database, Key, Server } from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export default function SecurityPage() {
  const pillars = [
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

      <main className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-16">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#d48b38]">
            <ShieldCheck className="h-4 w-4 text-[#d48b38]" />
            <span>Security & Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f4f4f6]">
            Enterprise Data Privacy & Security Architecture
          </h1>
          <p className="text-sm sm:text-base text-[#9fa2b4] leading-relaxed">
            BetterBee is built with strict privacy controls, isolated storage, and verifiable provenance at every tier of the stack.
          </p>
        </div>

        {/* Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-[#23252d] bg-[#18191f] p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded bg-[#14151a] border border-[#272935] flex items-center justify-center text-[#d48b38]">
                  <item.icon className="h-4 w-4" />
                </div>
                <h2 className="text-sm sm:text-base font-medium text-[#eaebee]">{item.title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#9fa2b4] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Security Specifications Table */}
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

        {/* CTA */}
        <div className="rounded-xl border border-[#23252d] bg-[#18191f] p-8 text-center space-y-4">
          <h2 className="text-xl font-medium text-[#f4f4f6]">
            Host and govern your documents with confidence
          </h2>
          <p className="text-xs text-[#8b8e9b] max-w-md mx-auto">
            Experience private document intelligence with full data sovereignty.
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
