import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ══════════════════════════════════════════════════════════════════════
// x402 Negotiate Endpoint
// ──────────────────────────────────────────────────────────────────────
// Locus-compatible HTTP 402 endpoint that wraps the core LLM
// negotiation engine. Designed for machine callers — another agent
// or MCP server can POST here, pay the x402 micro-fee, and receive a
// structured negotiation response.
//
// Usage:
//   POST /api/x402/negotiate
//   Body: { assetName, estimatedValue, messages, ethPrice?, ... }
//   Returns: { public_message, agent_intent, is_agreed, final_price,
//              x402: { paymentRequired, priceUsd, payTo } }
// ══════════════════════════════════════════════════════════════════════

const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";
const OPERATOR_WALLET = "0x624a621f4af50c3f532d6cd7f1088f021ca41621";
const X402_PRICE_USD = 0.001; // $0.001 per negotiation turn

interface X402NegotiateBody {
  assetName: string;
  estimatedValue: number;
  messages?: { role: string; content: string }[];
  ethPrice?: number;
  tavilyContext?: string;
  alphaVantageContext?: string;
  ofacClearance?: string;
  tradeHistory?: { assetName: string; price: number; timestamp: string }[];
  /** Fear/Greed index for adaptive strategy */
  fearGreedIndex?: number;
  fearGreedLabel?: string;
  marketSentiment?: string;
  /** TWAP price ceiling for hard enforcement */
  twapCeiling?: number;
  /** Average efficiency score from past negotiations (P7) */
  avgEfficiency?: number;
  /** Buyer or Seller turn — defaults to buyer */
  currentTurn?: "BUYER" | "SELLER";
  /** Turn number for context */
  turnNumber?: number;
}

// ── System prompt builder (mirrors core negotiate route) ──
function buildX402BuyerPrompt(
  assetName: string,
  estimatedValue: number,
  ethPrice?: number,
  tavilyContext?: string,
  alphaVantageContext?: string,
  tradeHistory?: { assetName: string; price: number; timestamp: string }[],
  fearGreedIndex?: number,
  fearGreedLabel?: string,
  marketSentiment?: string,
  twapCeiling?: number,
  avgEfficiency?: number,
): string {
  const ethBlock = ethPrice
    ? `\nLIVE MARKET (CoinGecko): ETH = $${ethPrice.toFixed(2)}\n`
    : "";
  const tavilyBlock = tavilyContext
    ? `\nWEB INTEL (Tavily):\n${tavilyContext}\n`
    : "";
  const avBlock = alphaVantageContext
    ? `\nSENTIMENT (Alpha Vantage):\n${alphaVantageContext}\n`
    : "";

  // P6: Agent Memory
  let memoryBlock = "";
  if (tradeHistory && tradeHistory.length > 0) {
    const recent = tradeHistory.slice(-3);
    const lines = recent.map(
      (t) => `  - ${t.assetName}: $${t.price.toFixed(4)} (${t.timestamp})`
    );
    memoryBlock = `\nTRADE MEMORY (last ${recent.length} trades):\n${lines.join("\n")}\nUse this history to calibrate your offers. If past trades settled below estimated value, hold firm.\n`;
  }

  // P5: Adaptive strategy
  let strategyDirective = "Standard negotiation — target 70-80% of estimated value.";
  if (fearGreedIndex != null && fearGreedLabel && marketSentiment) {
    if (marketSentiment === "bearish" || fearGreedIndex <= 40) {
      strategyDirective = `AGGRESSIVE STRATEGY — Fear & Greed: ${fearGreedIndex}/100 (${fearGreedLabel}). Market is fearful. Lowball aggressively. Target 50-65% of estimated value. Sellers are desperate.`;
    } else if (marketSentiment === "bullish" || fearGreedIndex >= 70) {
      strategyDirective = `CAUTIOUS STRATEGY — Fear & Greed: ${fearGreedIndex}/100 (${fearGreedLabel}). Market is greedy. Pay fair value quickly. Target 85-95% of estimated value to secure the asset before it appreciates.`;
    } else {
      strategyDirective = `BALANCED STRATEGY — Fear & Greed: ${fearGreedIndex}/100 (${fearGreedLabel}). Market is neutral. Standard negotiation at 70-80% of estimated value.`;
    }
  }

  // P1: TWAP ceiling block
  let twapBlock = "";
  if (twapCeiling != null) {
    twapBlock = `\nHARD PRICE CEILING (TWAP): $${twapCeiling.toFixed(4)}\nNEVER agree to a price above this ceiling. If the seller won't go below, walk away.\n`;
  }

  // P7: Efficiency learning
  let efficiencyBlock = "";
  if (avgEfficiency != null && avgEfficiency > 0) {
    efficiencyBlock = `\nPAST PERFORMANCE: Average negotiation efficiency: ${(avgEfficiency * 100).toFixed(1)}%. Try to match or beat this.\n`;
  }

  return `You are BUYER_AGENT in an x402-powered autonomous negotiation protocol.
OUTPUT: Respond with ONLY a single raw JSON object. No markdown, no code fences.

CONTEXT:
- Asset: "${assetName}"
- Estimated value: $${estimatedValue.toFixed(2)}
${ethBlock}${tavilyBlock}${avBlock}${memoryBlock}${twapBlock}${efficiencyBlock}
STRATEGY: ${strategyDirective}

- When the seller's price is within 10% of your target, ACCEPT immediately (is_agreed=true).
- For $0.01 assets, agree within 1-2 rounds.
- Reference data sources in public_message.

JSON: {"public_message":"string","agent_intent":"string","is_agreed":false,"final_price":null}
Accept: {"public_message":"string","agent_intent":"string","is_agreed":true,"final_price":0.01}`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "LOCUS_API_KEY not configured." },
        { status: 500 }
      );
    }

    const body: X402NegotiateBody = await request.json();
    const {
      assetName,
      estimatedValue,
      messages = [],
      ethPrice,
      tavilyContext,
      alphaVantageContext,
      tradeHistory,
      fearGreedIndex,
      fearGreedLabel,
      marketSentiment,
      twapCeiling,
      avgEfficiency,
      currentTurn,
    } = body;

    if (!assetName || estimatedValue == null) {
      // Return 402 — payment details in body so a machine caller knows
      // the required fee and can retry with payment attached
      return NextResponse.json(
        {
          error: "Missing required: assetName, estimatedValue.",
          x402: {
            paymentRequired: true,
            priceUsd: X402_PRICE_USD,
            currency: "USDC",
            network: "Base",
            payTo: OPERATOR_WALLET,
            description:
              "Pay $0.001 USDC to this address, then include the txHash in the X-Payment header to authenticate.",
          },
        },
        { status: 402 }
      );
    }

    // Build the system prompt — support both buyer and seller turns
    let systemPrompt: string;
    if (currentTurn === "SELLER") {
      systemPrompt = `You are SELLER_AGENT in an autonomous x402 negotiation protocol.
OUTPUT: Respond with ONLY a single raw JSON object. No markdown, no code fences.

You are selling "${assetName}" (estimated value: $${estimatedValue.toFixed(2)}).
- Start at or slightly above estimated value.
- You can negotiate down, but never below 60% of estimated value.
- If the buyer's offer is within 10% of your asking price, ACCEPT (is_agreed=true).
- For $0.01 assets, agree quickly within 1-3 rounds.

JSON: {"public_message":"string","agent_intent":"string","is_agreed":false,"final_price":null}
Accept: {"public_message":"string","agent_intent":"string","is_agreed":true,"final_price":0.01}`;
    } else {
      systemPrompt = buildX402BuyerPrompt(
        assetName,
        estimatedValue,
        ethPrice,
        tavilyContext,
        alphaVantageContext,
        tradeHistory,
        fearGreedIndex,
        fearGreedLabel,
        marketSentiment,
        twapCeiling,
        avgEfficiency,
      );
    }

    // Call Locus Wrapped OpenAI
    const res = await fetchWithRetry(`${LOCUS_BASE}/wrapped/openai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`LLM error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const raw =
      data?.choices?.[0]?.message?.content ??
      data?.data?.choices?.[0]?.message?.content ??
      "";

    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
    const cleaned = (jsonMatch[1] ?? raw).trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        public_message: cleaned,
        agent_intent: "Non-JSON LLM response",
        is_agreed: false,
        final_price: null,
      };
    }

    return NextResponse.json({
      public_message: parsed.public_message ?? "",
      agent_intent: parsed.agent_intent ?? "",
      is_agreed: parsed.is_agreed ?? false,
      final_price: parsed.final_price ?? null,
      x402: {
        paymentRequired: false,
        priceUsd: X402_PRICE_USD,
        currency: "USDC",
        network: "Base",
        payTo: OPERATOR_WALLET,
        endpoint: "/api/x402/negotiate",
        description: "x402 negotiation turn consumed.",
      },
    });
  } catch (err) {
    console.error("[/api/x402/negotiate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
