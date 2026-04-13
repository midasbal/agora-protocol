import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agora Protocol — Whitepaper",
  description:
    "Technical documentation and whitepaper for Agora Protocol: the autonomous settlement layer for the Agentic Economy.",
};

/* ─────────────────────────────────────────────────────────────
   Tiny re-usable pieces
   ───────────────────────────────────────────────────────────── */

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-24" />;
}

function Badge({ children, color = "green" }: { children: React.ReactNode; color?: "green" | "blue" | "purple" | "amber" | "pink" | "cyan" }) {
  const map: Record<string, string> = {
    green:  "border-neon-green/30 bg-neon-green/8 text-neon-green",
    blue:   "border-neon-blue/30 bg-neon-blue/8 text-neon-blue",
    purple: "border-purple-400/30 bg-purple-400/8 text-purple-400",
    amber:  "border-amber-400/30 bg-amber-400/8 text-amber-400",
    pink:   "border-pink-400/30 bg-pink-400/8 text-pink-400",
    cyan:   "border-cyan-400/30 bg-cyan-400/8 text-cyan-400",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${map[color]}`}>
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-neon-green/10 bg-panel-bg/60 px-5 py-4">
      <span className="text-2xl font-black tracking-tight text-neon-green">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-neon-green/40">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   API Row for the tech-stack table
   ───────────────────────────────────────────────────────────── */

function ApiRow({ num, name, endpoint, purpose, stage }: { num: number; name: string; endpoint: string; purpose: string; stage: string }) {
  return (
    <tr className="border-b border-neon-green/5 transition-colors hover:bg-neon-green/[0.03]">
      <td className="px-4 py-2.5 text-neon-green/30 tabular-nums text-center">{num}</td>
      <td className="px-4 py-2.5 font-bold text-neon-green">{name}</td>
      <td className="px-4 py-2.5 font-mono text-[10px] text-neon-blue/70">{endpoint}</td>
      <td className="px-4 py-2.5 text-neon-green/50">{purpose}</td>
      <td className="px-4 py-2.5">
        <Badge color="blue">{stage}</Badge>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DOCS PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-background font-mono text-neon-green">
      {/* Subtle grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: "linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* ── Sticky Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-neon-green/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neon-green/60 transition-colors hover:text-neon-green"
          >
            <span className="text-base">←</span> Back to Terminal
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-[9px] uppercase tracking-widest text-neon-green/25">
            <a href="#executive-summary" className="hover:text-neon-green/60 transition-colors">Summary</a>
            <span className="text-neon-green/10">·</span>
            <a href="#the-problem" className="hover:text-neon-green/60 transition-colors">Problem</a>
            <span className="text-neon-green/10">·</span>
            <a href="#tech-stack" className="hover:text-neon-green/60 transition-colors">Tech</a>
            <span className="text-neon-green/10">·</span>
            <a href="#features" className="hover:text-neon-green/60 transition-colors">Features</a>
            <span className="text-neon-green/10">·</span>
            <a href="#revenue" className="hover:text-neon-green/60 transition-colors">Revenue</a>
            <span className="text-neon-green/10">·</span>
            <a href="#whats-real" className="hover:text-neon-green/60 transition-colors">Proof</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-green/60 shadow-[0_0_4px_var(--neon-green)]" />
            <span className="text-[9px] uppercase tracking-widest text-neon-green/30">Whitepaper v1.0</span>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative z-10 border-b border-neon-green/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-16">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge color="green">Live on Base</Badge>
            <Badge color="blue">Real USDC</Badge>
            <Badge color="purple">13 APIs</Badge>
            <Badge color="amber">OFAC Compliant</Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
            <span className="text-neon-green">Agora</span>{" "}
            <span className="text-neon-green/40">Protocol</span>
          </h1>
          <p className="max-w-2xl text-sm sm:text-lg leading-relaxed text-neon-green/50 font-sans">
            The autonomous settlement layer for the Agentic Economy. AI agents negotiate,
            comply, settle, and deliver — with zero human intervention, real USDC on Base,
            and verifiable on-chain proof.
          </p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat value="13" label="Locus APIs" />
            <Stat value="7" label="Pipeline Stages" />
            <Stat value="$0.01" label="Per Trade" />
            <Stat value="<30s" label="End-to-End" />
          </div>
        </div>
        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green/20 to-transparent" />
      </header>

      {/* ── Content ── */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-24">

        {/* ════════════════════════════════════════════
            §1 — EXECUTIVE SUMMARY
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="executive-summary" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-neon-green/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neon-green/50 whitespace-nowrap">
              01 · Executive Summary
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-neon-green/20 to-transparent" />
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-neon-green/60 font-sans">
            <p>
              We are entering the <strong className="text-neon-green/90">Agentic Economy</strong> — a world where billions of
              AI agents will autonomously procure compute, data, and services from each other. These agents need settlement
              rails: infrastructure that lets them discover assets, verify counterparties, negotiate fair prices, and settle
              payments — all without a human in the loop.
            </p>
            <p>
              <strong className="text-neon-green/90">Agora Protocol</strong> is that infrastructure. Built on{" "}
              <strong className="text-neon-blue">Locus Paygentic</strong>, it composes 13 APIs into a single deterministic
              pipeline that takes an AI agent from wallet registration to on-chain settlement in under 30 seconds. Every
              transaction is real USDC on Base L2. Every negotiation round is an autonomous LLM decision. Every settlement
              is verifiable on BaseScan.
            </p>
            <p>
              This isn&apos;t a prototype with mocked APIs. This is a live, working system that has executed real
              micro-transactions on mainnet, with compliance screening, multi-source market intelligence, and
              AI-generated deliverables — all powered by Locus&apos;s wrapped API ecosystem.
            </p>
          </div>

          {/* Architecture — Subway Map Pipeline */}
          <div className="mt-10 rounded-xl border border-neon-green/10 bg-panel-bg/60 p-6 sm:p-8">
            <p className="text-[9px] uppercase tracking-widest text-neon-green/30 mb-6">Architecture · 7-Stage Pipeline</p>

            {/* Row 1: Register → Fund → Intel → Comply */}
            <div className="flex flex-col sm:flex-row items-stretch gap-0">
              {[
                { name: "REGISTER", sub: "Agent · ERC-4337", color: "border-orange-400/40 text-orange-400", dot: "bg-orange-400 shadow-[0_0_6px_#fb923c]" },
                { name: "FUND", sub: "$0.01 · Pay Send", color: "border-neon-green/40 text-neon-green", dot: "bg-neon-green shadow-[0_0_6px_var(--neon-green)]" },
                { name: "INTEL", sub: "5-Source · CG+AV+TV+Exa+FC", color: "border-cyan-400/40 text-cyan-400", dot: "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" },
                { name: "COMPLY", sub: "OFAC · SDN List", color: "border-amber-400/40 text-amber-400", dot: "bg-amber-400 shadow-[0_0_6px_#fbbf24]" },
              ].map((stage, i) => (
                <div key={stage.name} className="flex items-center flex-1 min-w-0">
                  <div className={`relative flex-1 rounded-lg border ${stage.color} bg-background/60 px-3 py-2.5 sm:px-4 sm:py-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${stage.dot}`} />
                      <span className="text-[11px] font-bold tracking-wider">{stage.name}</span>
                    </div>
                    <span className="text-[9px] text-neon-green/30 leading-tight block">{stage.sub}</span>
                  </div>
                  {i < 3 && (
                    <div className="hidden sm:flex items-center px-1 text-neon-green/25">
                      <span className="text-sm">→</span>
                    </div>
                  )}
                  {i < 3 && (
                    <div className="flex sm:hidden items-center justify-center py-0.5 text-neon-green/25">
                      <span className="text-sm">↓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Connector: Comply ↓ to Negotiate */}
            <div className="flex justify-end pr-[12%] sm:pr-[8%] py-1.5">
              <div className="flex flex-col items-center text-neon-green/20">
                <div className="h-4 w-px bg-neon-green/15" />
                <span className="text-xs">↓</span>
              </div>
            </div>

            {/* Row 2: Deliver ← Settle ← Negotiate (reversed visual) */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch gap-0">
              {[
                { name: "DELIVER", sub: "AI Cert · Stability AI", color: "border-pink-400/40 text-pink-400", dot: "bg-pink-400 shadow-[0_0_6px_#f472b6]" },
                { name: "SETTLE", sub: "Checkout · 2-Key", color: "border-purple-400/40 text-purple-400", dot: "bg-purple-400 shadow-[0_0_6px_#c084fc]" },
                { name: "NEGOTIATE", sub: "LLM v LLM · GPT-4o", color: "border-neon-blue/40 text-neon-blue", dot: "bg-neon-blue shadow-[0_0_6px_var(--neon-blue)]" },
              ].map((stage, i) => (
                <div key={stage.name} className="flex items-center flex-1 min-w-0">
                  {i > 0 && (
                    <div className="hidden sm:flex items-center px-1 text-neon-green/25">
                      <span className="text-sm">←</span>
                    </div>
                  )}
                  {i > 0 && (
                    <div className="flex sm:hidden items-center justify-center py-0.5 text-neon-green/25">
                      <span className="text-sm">↑</span>
                    </div>
                  )}
                  <div className={`relative flex-1 rounded-lg border ${stage.color} bg-background/60 px-3 py-2.5 sm:px-4 sm:py-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${stage.dot}`} />
                      <span className="text-[11px] font-bold tracking-wider">{stage.name}</span>
                    </div>
                    <span className="text-[9px] text-neon-green/30 leading-tight block">{stage.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom label */}
            <div className="mt-5 pt-3 border-t border-neon-green/5 text-center">
              <span className="text-[9px] uppercase tracking-widest text-neon-green/25">
                13 Locus APIs · 7 Pipeline Stages · Real USDC on Base
              </span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            §2 — THE PROBLEM
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="the-problem" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-red-400/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400/60 whitespace-nowrap">
              02 · The Problem
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-red-400/20 to-transparent" />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "🧠",
                title: "Manual Bidding",
                description:
                  "Today's AI agents can reason and plan, but when they need to buy compute, data, or services, a human has to manually negotiate and execute payment. This creates a bottleneck that defeats the purpose of autonomy.",
              },
              {
                icon: "😰",
                title: "Emotional Trading",
                description:
                  "Human-mediated pricing is subject to cognitive biases, FOMO, and poor market timing. AI agents with access to real-time market data can make strictly rational, data-driven decisions — but they lack the payment rails to act on them.",
              },
              {
                icon: "🚫",
                title: "No Settlement Rails",
                description:
                  "There is no standard infrastructure for machine-to-machine payment. No protocol for agent wallet provisioning, compliance screening, multi-turn negotiation, and atomic on-chain settlement in a single composable flow.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg border border-red-400/10 bg-panel-bg/60 p-5 transition-colors hover:border-red-400/20"
              >
                <span className="text-2xl mb-3 block">{card.icon}</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400/80 mb-2">{card.title}</h3>
                <p className="text-[11px] leading-relaxed text-neon-green/45 font-sans">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-neon-green/10 bg-neon-green/[0.02] p-5">
            <p className="text-xs leading-relaxed text-neon-green/60 font-sans">
              <strong className="text-neon-green/90">Agora Protocol solves all three.</strong> It provides a complete,
              composable settlement stack — from agent registration through OFAC compliance to verified delivery — so
              AI agents can autonomously transact with each other using real money, in real time, with full regulatory
              awareness.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            §3 — THE TECH STACK
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="tech-stack" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-neon-blue/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neon-blue/60 whitespace-nowrap">
              03 · Tech Stack & API Composability
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-neon-blue/20 to-transparent" />
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-neon-green/60 font-sans mb-8">
            <p>
              Agora Protocol is built on <strong className="text-neon-blue">Next.js 16</strong> with the App Router,
              TypeScript, and Tailwind CSS v4. The backend is a set of API routes that compose{" "}
              <strong className="text-neon-green/90">13 Locus APIs</strong> into a deterministic 7-stage pipeline.
              All transactions execute on <strong className="text-neon-blue">Base L2</strong> (Coinbase) using{" "}
              <strong className="text-neon-green/90">ERC-4337 smart wallets</strong> for gasless UX.
            </p>
          </div>

          {/* API Table */}
          <div className="rounded-xl border border-neon-green/10 bg-panel-bg/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-neon-green/8 bg-panel-bg/40">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neon-green/40">
                13 Locus APIs Composed End-to-End
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-neon-green/8 text-left text-neon-green/30 uppercase tracking-wider text-[9px]">
                    <th className="px-4 py-2.5 font-medium text-center w-10">#</th>
                    <th className="px-4 py-2.5 font-medium">API</th>
                    <th className="px-4 py-2.5 font-medium">Endpoint</th>
                    <th className="px-4 py-2.5 font-medium">Purpose</th>
                    <th className="px-4 py-2.5 font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  <ApiRow num={1}  name="Agent Self-Register" endpoint="POST /agents/self-register" purpose="Provision ERC-4337 smart wallet + API key" stage="Register" />
                  <ApiRow num={2}  name="Pay Send"            endpoint="POST /pay/send"             purpose="Fund agent wallet with USDC"          stage="Fund" />
                  <ApiRow num={3}  name="CoinGecko"           endpoint="POST /wrapped/coin-gecko/query" purpose="Live ETH/USD spot price oracle"   stage="Intel" />
                  <ApiRow num={4}  name="CoinGecko Historical" endpoint="POST /wrapped/coingecko/coins-market-chart" purpose="7-day TWAP price ceiling" stage="Intel" />
                  <ApiRow num={5}  name="Alpha Vantage"       endpoint="POST /wrapped/alpha-vantage/query" purpose="Crypto sentiment & Fear/Greed" stage="Intel" />
                  <ApiRow num={6}  name="Tavily Search"       endpoint="POST /wrapped/tavily/search" purpose="Real-time web pricing intelligence"  stage="Intel" />
                  <ApiRow num={7}  name="OFAC Sanctions"      endpoint="POST /wrapped/ofac-sanctions/search" purpose="SDN list screening"          stage="Comply" />
                  <ApiRow num={8}  name="Exa Search"          endpoint="POST /wrapped/exa/search"    purpose="Deep web research for asset context" stage="Negotiate" />
                  <ApiRow num={9}  name="OpenAI (GPT-4o)"     endpoint="POST /wrapped/openai/chat"   purpose="Autonomous LLM negotiation"         stage="Negotiate" />
                  <ApiRow num={10} name="Checkout Session"    endpoint="POST /checkout/sessions"      purpose="Seller creates payment session"     stage="Settle" />
                  <ApiRow num={11} name="Checkout Agent Pay"  endpoint="POST /checkout/agent/pay/:id" purpose="Buyer settles — real USDC"          stage="Settle" />
                  <ApiRow num={12} name="Stability AI"        endpoint="POST /wrapped/stability-ai/text-to-image" purpose="AI certificate generation" stage="Deliver" />
                  <ApiRow num={13} name="Firecrawl"           endpoint="POST /wrapped/firecrawl/scrape" purpose="Dynamic asset discovery via web scraping" stage="Intel" />
                </tbody>
              </table>
            </div>
            <div className="px-5 py-2.5 border-t border-neon-green/5 text-[9px] text-neon-green/25">
              + MPP Fee Split via Pay Send with explicit <code className="text-neon-blue/50">to_address</code> for protocol treasury revenue
            </div>
          </div>

          {/* Tech Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Framework", value: "Next.js 16 · App Router · Turbopack", color: "border-neon-green/15" },
              { label: "Chain", value: "Base L2 · ERC-4337 · Gasless", color: "border-neon-blue/15" },
              { label: "Currency", value: "USDC (Real) · Micro-transactions", color: "border-purple-400/15" },
            ].map((card) => (
              <div key={card.label} className={`rounded-lg border ${card.color} bg-panel-bg/40 px-4 py-3`}>
                <p className="text-[9px] uppercase tracking-widest text-neon-green/25 mb-1">{card.label}</p>
                <p className="text-xs font-bold text-neon-green/80">{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            §4 — FEATURES
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="features" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400/60 whitespace-nowrap">
              04 · Features
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-purple-400/20 to-transparent" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: "🤖",
                title: "Autonomous Trade Loop",
                badge: "Zero Intervention",
                badgeColor: "green" as const,
                description:
                  "Single-button deployment that iterates through all available assets within a configurable budget ceiling ($0.01–$0.10 USDC). The protocol deploys an agent, funds it, gathers intelligence, screens for sanctions, negotiates via LLM, settles on-chain, and delivers an AI certificate — all autonomously.",
              },
              {
                icon: "📊",
                title: "Multi-Oracle Price Discovery",
                badge: "5 Sources",
                badgeColor: "blue" as const,
                description:
                  "Every negotiation is informed by five independent data sources: CoinGecko (live spot prices + 7-day TWAP), Alpha Vantage (crypto news sentiment & Fear/Greed Index), Tavily (real-time web search), Exa (deep research), and Firecrawl (web scraping for asset discovery). The buyer agent cites this data in its negotiation strategy.",
              },
              {
                icon: "🛡️",
                title: "OFAC Compliance Gate",
                badge: "Sanctions Screening",
                badgeColor: "amber" as const,
                description:
                  "Before any negotiation begins, the counterparty wallet is screened against the US Treasury's OFAC Specially Designated Nationals list via Locus's wrapped sanctions API. Sanctioned wallets are blocked from trading — a real compliance layer for agentic finance.",
              },
              {
                icon: "🎨",
                title: "Verifiable Asset Delivery",
                badge: "AI Generated",
                badgeColor: "pink" as const,
                description:
                  "Post-settlement, the protocol generates an AI certificate via Stability AI (with fal.ai fallback), proving the protocol doesn't just move money — it delivers tangible value. The certificate is displayed in-app with model attribution.",
              },
              {
                icon: "📈",
                title: "Negotiation Replay",
                badge: "Visual Analytics",
                badgeColor: "cyan" as const,
                description:
                  "A visual sparkline renders buyer/seller price convergence across negotiation rounds. Watch exactly how two LLMs find agreement — including the per-round offers, strategic reasoning, and final convergence point.",
              },
              {
                icon: "⛓️",
                title: "On-Chain Verification",
                badge: "BaseScan Proof",
                badgeColor: "green" as const,
                description:
                  "Every settlement produces a real transaction hash verifiable on BaseScan. The app queries BaseScan's API to confirm on-chain receipt status and provides a clickable link to the transaction explorer.",
              },
              {
                icon: "👁",
                title: "Watch Mode",
                badge: "Conditional Trading",
                badgeColor: "cyan" as const,
                description:
                  "Set strict financial guardrails (max ETH price, required sentiment) and let the agent poll the market every 15 seconds. When all compound conditions are met — ETH ✓, Sentiment ✓, TWAP ✓ — the trade triggers automatically.",
              },
              {
                icon: "🧠",
                title: "Adaptive Strategy (Fear/Greed)",
                badge: "Sentiment-Driven",
                badgeColor: "amber" as const,
                description:
                  "The buyer agent dynamically adjusts its negotiation strategy based on the Alpha Vantage Fear & Greed Index. In fear → aggressive lowball. In greed → pay fair value quickly. Agent memory from past trades further calibrates strategy.",
              },
              {
                icon: "📈",
                title: "TWAP Price Ceiling",
                badge: "Hard Enforced",
                badgeColor: "green" as const,
                description:
                  "7-day Time-Weighted Average Price computed from historical CoinGecko data serves as a hard price ceiling. Enforced at the application layer — if the negotiated price exceeds the TWAP, settlement is blocked regardless of LLM agreement.",
              },
              {
                icon: "🔍",
                title: "Firecrawl Asset Discovery",
                badge: "Autonomous Discovery",
                badgeColor: "amber" as const,
                description:
                  "Scrape any URL with Locus Wrapped Firecrawl to dynamically discover tradeable digital assets. LLM extracts structured data from scraped content. In autonomous mode, discovery runs before trading to expand the asset pool.",
              },
              {
                icon: "🔌",
                title: "x402 Self-Consumption",
                badge: "HTTP 402 Native",
                badgeColor: "purple" as const,
                description:
                  "The buyer agent routes its own negotiation turns through the x402 payment endpoint — proving the protocol can consume its own paid APIs. External agents can also POST, pay a $0.001 micro-fee, and receive structured negotiation responses.",
              },
              {
                icon: "🏪",
                title: "Dual Agent Wallets",
                badge: "Two-Sided Market",
                badgeColor: "blue" as const,
                description:
                  "Both buyer and seller agents are independently registered via Locus Self-Register, each with their own ERC-4337 smart wallet. Both wallets are displayed in the UI as clickable BaseScan links — proving true two-sided agent infrastructure.",
              },
              {
                icon: "📊",
                title: "Efficiency Scoring & Learning",
                badge: "Self-Improving",
                badgeColor: "green" as const,
                description:
                  "After each settlement, the protocol calculates negotiation efficiency (savings vs. estimated value). Average efficiency is injected into the LLM prompt for subsequent trades — the agent literally learns to negotiate better over time.",
              },
              {
                icon: "📋",
                title: "Portfolio Summary",
                badge: "Post-Session Analytics",
                badgeColor: "cyan" as const,
                description:
                  "After an autonomous session, a styled summary card shows assets acquired, total spent, average efficiency, and budget utilization with per-asset efficiency breakdown.",
              },
              {
                icon: "📄",
                title: "Export Transcript",
                badge: "JSON Download",
                badgeColor: "purple" as const,
                description:
                  "One-click JSON export of the full session data: logs, trade history, negotiation replay, efficiency scores, portfolio summary, and agent wallet details. Complete audit trail.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-neon-green/8 bg-panel-bg/40 p-5 transition-colors hover:border-neon-green/15"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xl">{feature.icon}</span>
                  <Badge color={feature.badgeColor}>{feature.badge}</Badge>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neon-green/90 mb-2">{feature.title}</h3>
                <p className="text-[11px] leading-relaxed text-neon-green/45 font-sans">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            §5 — REVENUE MODEL
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="revenue" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-neon-green/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neon-green/50 whitespace-nowrap">
              05 · Revenue Model
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-neon-green/20 to-transparent" />
          </div>

          <div className="rounded-xl border border-neon-green/10 bg-panel-bg/60 p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neon-green/80 mb-3">
                Protocol Fee Architecture
              </h3>
              <p className="text-[11px] leading-relaxed text-neon-green/50 font-sans mb-4">
                Every settlement triggers a protocol fee collected via Locus Pay Send with an explicit{" "}
                <code className="text-neon-blue/60 bg-neon-blue/5 px-1 rounded">to_address</code> pointing to the
                protocol treasury wallet. This is real revenue — USDC flowing to a wallet we control, on every trade.
              </p>
            </div>

            {/* Fee Split Visualization */}
            <div className="rounded-lg border border-neon-green/8 bg-background/60 p-5 font-mono text-[11px]">
              <p className="text-neon-green/40 mb-3">Every Settlement ($0.01 micro-transaction)</p>
              <div className="space-y-1.5 text-neon-green/60">
                <div className="flex items-center gap-3">
                  <div className="w-full max-w-md bg-neon-green/5 rounded-full overflow-hidden h-4">
                    <div className="h-full bg-neon-green/20 rounded-full" style={{ width: "95%" }} />
                  </div>
                  <span className="whitespace-nowrap text-neon-green/80 font-bold">95%</span>
                  <span className="text-neon-green/40">→ Seller Agent</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-full max-w-md bg-purple-400/5 rounded-full overflow-hidden h-4">
                    <div className="h-full bg-purple-400/30 rounded-full" style={{ width: "5%" }} />
                  </div>
                  <span className="whitespace-nowrap text-purple-400 font-bold">&nbsp;5%</span>
                  <span className="text-neon-green/40">→ Protocol Treasury</span>
                </div>
              </div>
            </div>

            {/* Projections */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neon-green/80 mb-3">
                Scale Projections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { scale: "1K trades/day", rev: "$0.50/day", period: "Launch" },
                  { scale: "100K trades/day", rev: "$50/day", period: "Growth" },
                  { scale: "1M trades/day", rev: "$500/day", period: "Scale" },
                ].map((tier) => (
                  <div key={tier.period} className="rounded-lg border border-neon-green/8 bg-background/40 p-4 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-neon-green/25 mb-1">{tier.period}</p>
                    <p className="text-lg font-black text-neon-green mb-0.5">{tier.rev}</p>
                    <p className="text-[10px] text-neon-green/35">{tier.scale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B Vision */}
            <div className="border-t border-neon-green/8 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neon-green/80 mb-3">
                B2B Agent-as-a-Service Vision
              </h3>
              <p className="text-[11px] leading-relaxed text-neon-green/50 font-sans">
                Beyond protocol fees, Agora positions itself as <strong className="text-neon-green/80">settlement infrastructure
                for enterprise AI</strong>. Companies deploying autonomous agents (procurement bots, data acquisition agents,
                compute arbitrageurs) can plug into Agora&apos;s pipeline as a service — paying per-trade for compliant,
                audited, on-chain settlement. The composable API architecture means new asset types, compliance rules, and
                settlement strategies can be added without rewriting the core protocol.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            §6 — WHAT'S REAL vs. SIMULATED
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="whats-real" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400/60 whitespace-nowrap">
              06 · What&apos;s Real vs. Simulated
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-cyan-400/20 to-transparent" />
          </div>

          <p className="text-sm text-neon-green/50 font-sans mb-6">
            We believe in radical transparency. Here is exactly what is real and what is simulated in this demo.
          </p>

          <div className="rounded-xl border border-neon-green/10 bg-panel-bg/60 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-neon-green/8 text-left text-neon-green/30 uppercase tracking-wider text-[9px]">
                  <th className="px-5 py-2.5 font-medium">Component</th>
                  <th className="px-5 py-2.5 font-medium text-center">Status</th>
                  <th className="px-5 py-2.5 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { component: "USDC Settlements on Base", status: "real", detail: "Verifiable on BaseScan — real money moves" },
                  { component: "Agent Wallet Registration", status: "real", detail: "Locus self-register — buyer + seller ERC-4337 wallets" },
                  { component: "Wallet Funding ($0.01)", status: "real", detail: "Locus Pay Send — USDC on-chain transfer" },
                  { component: "OFAC Compliance Screening", status: "real", detail: "Locus wrapped OFAC Sanctions API" },
                  { component: "AI Negotiation (LLM vs LLM)", status: "real", detail: "GPT-4o via Locus — autonomous decisions" },
                  { component: "Market Intelligence (5 sources)", status: "real", detail: "CoinGecko + Alpha Vantage + Tavily + Exa + Firecrawl" },
                  { component: "TWAP Price Ceiling", status: "real", detail: "7-day historical CoinGecko, hard-enforced at app layer" },
                  { component: "Adaptive Strategy (Fear/Greed)", status: "real", detail: "Alpha Vantage sentiment drives LLM strategy dynamically" },
                  { component: "Agent Memory & Efficiency Learning", status: "real", detail: "Past trades + avg efficiency injected into LLM prompt" },
                  { component: "Watch Mode (Compound Conditions)", status: "real", detail: "15s polling with ETH ✓/✗ + Sentiment ✓/✗ + TWAP ✓/✗" },
                  { component: "x402 Self-Consumption", status: "real", detail: "Buyer routes turns through own x402 endpoint" },
                  { component: "AI Certificate Generation", status: "real", detail: "Stability AI via Locus wrapped API" },
                  { component: "Protocol Fee Collection", status: "real", detail: "USDC to treasury wallet via Pay Send (5%)" },
                  { component: "Firecrawl Asset Discovery", status: "real", detail: "Locus Wrapped Firecrawl scraping + LLM extraction" },
                  { component: "Portfolio Summary & Export", status: "real", detail: "Post-session analytics + JSON transcript download" },
                  { component: "Digital Asset Ownership", status: "simulated", detail: "No on-chain NFT minting — simulated transfer" },
                  { component: "Agent Autonomy", status: "guided", detail: "Pipeline is deterministic; LLM decisions are real" },
                ].map((row) => (
                  <tr key={row.component} className="border-b border-neon-green/5 transition-colors hover:bg-neon-green/[0.02]">
                    <td className="px-5 py-2.5 font-medium text-neon-green/70">{row.component}</td>
                    <td className="px-5 py-2.5 text-center">
                      {row.status === "real" && <span className="text-neon-green font-bold">✅ Real</span>}
                      {row.status === "simulated" && <span className="text-amber-400 font-bold">⚠️ Simulated</span>}
                      {row.status === "guided" && <span className="text-amber-400 font-bold">⚠️ Guided</span>}
                    </td>
                    <td className="px-5 py-2.5 text-neon-green/40 font-sans">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            §7 — FUTURE VISION
           ════════════════════════════════════════════ */}
        <section>
          <SectionAnchor id="future" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-fuchsia-400/20 to-transparent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-400/60 whitespace-nowrap">
              07 · Future Vision
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-fuchsia-400/20 to-transparent" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Multi-Chain Settlement",
                description: "Settle on Ethereum, Arbitrum, and Optimism via Locus's multi-chain support. Agent chooses the cheapest settlement path automatically.",
              },
              {
                title: "On-Chain NFT Minting",
                description: "Deliver real ERC-721 tokens as trade artifacts. Each settlement mints a proof-of-trade NFT with negotiation metadata embedded on-chain.",
              },
              {
                title: "Agent Reputation System",
                description: "Track negotiation efficiency, settlement reliability, and compliance history across trades. Build a decentralized agent credit score.",
              },
              {
                title: "x402 Payment Protocol",
                description: "HTTP-native micropayments for API access. Agents pay per-request using the x402 standard — no subscriptions, no API keys, just money.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-fuchsia-400/10 bg-panel-bg/40 p-5 transition-colors hover:border-fuchsia-400/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fuchsia-400/80 mb-2">{item.title}</h3>
                <p className="text-[11px] leading-relaxed text-neon-green/45 font-sans">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-neon-green/5 mt-8">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center">
          <p className="text-lg font-bold text-neon-green/60 mb-2">Built by humans, operated by machines.</p>
          <p className="text-[10px] uppercase tracking-widest text-neon-green/30 mb-4">
            Agora Protocol · Locus Paygentic Hackathon #1
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <a
              href="https://x.com/wjmdiary"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-neon-green/15 bg-neon-green/5 p-2.5 text-neon-green/50 transition-all hover:border-neon-green/30 hover:text-neon-green/80 hover:bg-neon-green/10"
              title="Follow on X"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-neon-green/20 bg-neon-green/5 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-neon-green transition-all hover:bg-neon-green/10 hover:border-neon-green/40 hover:shadow-[0_0_16px_rgba(0,255,136,0.15)]"
          >
            <span>←</span> Launch Terminal
          </Link>
        </div>
      </footer>
    </div>
  );
}
