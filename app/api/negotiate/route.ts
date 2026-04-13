import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface NegotiateRequestBody {
  currentTurn: "BUYER" | "SELLER";
  turnNumber: number;
  assetName: string;
  estimatedValue: number;
  messages: { role: string; content: string }[];
  /** Optional pre-trade intelligence injected by the frontend */
  securityContext?: string;
  ethPrice?: number;
  /** Multi-source intelligence context (Proposal 3) */
  tavilyContext?: string;
  alphaVantageContext?: string;
  ofacClearance?: string;
  /** P2: TWAP hard price ceiling */
  twapCeiling?: number;
  /** P5: Adaptive negotiation strategy — Fear/Greed index */
  fearGreedIndex?: number;
  fearGreedLabel?: string;
  marketSentiment?: string;
  /** P6: Agent memory — recent trade history */
  tradeHistory?: { assetName: string; price: number; timestamp: string }[];
  /** P7: Average negotiation efficiency for learning */
  avgEfficiency?: number;
}

interface AgentResponse {
  public_message: string;
  agent_intent: string;
  is_agreed: boolean;
  final_price: number | null;
}

// ── Locus Wrapped Exa Search (Market Scan) ──

async function searchMarketValue(
  assetName: string,
  apiKey: string
): Promise<string> {
  try {
    const res = await fetchWithRetry(`${LOCUS_BASE}/wrapped/exa/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `current market value price of ${assetName} digital asset 2024 2025`,
        numResults: 3,
        type: "neural",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Exa Search] Non-OK response:", res.status, errorText);
      return `Market scan failed (status ${res.status}). Rely on estimated value for negotiation.`;
    }

    const data = await res.json();

    // Extract relevant snippets from Exa results
    const results = data?.results ?? data?.data?.results ?? [];
    if (results.length === 0) {
      return "No market data found. Rely on estimated value for negotiation.";
    }

    const summaries = results
      .slice(0, 3)
      .map(
        (r: { title?: string; url?: string; text?: string }, i: number) =>
          `[${i + 1}] ${r.title ?? "Untitled"}: ${(r.text ?? "").slice(0, 200)}`
      )
      .join("\n");

    return `Market research results for "${assetName}":\n${summaries}`;
  } catch (err) {
    console.error("[Exa Search] Error:", err);
    return "Market scan encountered an error. Rely on estimated value for negotiation.";
  }
}

// ── Locus Wrapped OpenAI Chat ──

async function callLocusLLM(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<AgentResponse> {
  const res = await fetchWithRetry(`${LOCUS_BASE}/wrapped/openai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Locus Wrapped OpenAI API error (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();
  const raw =
    data?.choices?.[0]?.message?.content ??
    data?.data?.choices?.[0]?.message?.content ??
    "";

  // Parse the JSON from the LLM response (handle markdown code blocks)
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [
    null,
    raw,
  ];
  const cleaned = (jsonMatch[1] ?? raw).trim();

  try {
    const parsed: AgentResponse = JSON.parse(cleaned);
    return {
      public_message: parsed.public_message ?? "",
      agent_intent: parsed.agent_intent ?? "",
      is_agreed: parsed.is_agreed ?? false,
      final_price: parsed.final_price ?? null,
    };
  } catch {
    // If LLM returns non-JSON, wrap it as a public message
    return {
      public_message: cleaned,
      agent_intent: "Failed to parse structured response from LLM.",
      is_agreed: false,
      final_price: null,
    };
  }
}

// ── System Prompts ──

function buildBuyerSystemPrompt(
  assetName: string,
  estimatedValue: number,
  marketData: string,
  securityContext?: string,
  ethPrice?: number,
  tavilyContext?: string,
  alphaVantageContext?: string,
  ofacClearance?: string,
  twapCeiling?: number,
  fearGreedIndex?: number,
  fearGreedLabel?: string,
  marketSentiment?: string,
  tradeHistory?: { assetName: string; price: number; timestamp: string }[],
  avgEfficiency?: number,
): string {
  const securityBlock = securityContext
    ? `\nSECURITY INTELLIGENCE (via VirusTotal):\n${securityContext}\n`
    : "";
  const ethPriceBlock = ethPrice
    ? `\nLIVE MARKET DATA (via CoinGecko):\n- Current ETH price: $${ethPrice.toFixed(2)}\n`
    : "";
  const tavilyBlock = tavilyContext
    ? `\nWEB INTELLIGENCE (via Tavily):\n${tavilyContext}\n`
    : "";
  const alphaVantageBlock = alphaVantageContext
    ? `\nMARKET SENTIMENT (via Alpha Vantage):\n${alphaVantageContext}\n`
    : "";
  const ofacBlock = ofacClearance
    ? `\nCOMPLIANCE STATUS (via OFAC):\n${ofacClearance}\n`
    : "";

  // P2: TWAP hard ceiling
  const twapBlock = twapCeiling
    ? `\nTWAP PRICE CEILING (7-day average):\n- HARD CEILING: $${twapCeiling.toFixed(4)} — NEVER agree to a price above this.\n`
    : "";

  // P5: Adaptive strategy based on Fear/Greed
  let adaptiveStrategy = "- Standard strategy: Target 70-80% of estimated value.";
  if (fearGreedIndex != null && fearGreedLabel && marketSentiment) {
    if (marketSentiment === "bearish" || fearGreedIndex <= 40) {
      adaptiveStrategy = `- AGGRESSIVE STRATEGY ACTIVE — Fear & Greed Index: ${fearGreedIndex}/100 (${fearGreedLabel}).
- Market is FEARFUL. Sellers are desperate. LOWBALL aggressively.
- Target 50-65% of estimated value. Start at 40%. Concede minimally.
- Cite the bearish market conditions to pressure the seller.`;
    } else if (marketSentiment === "bullish" || fearGreedIndex >= 70) {
      adaptiveStrategy = `- CAUTIOUS STRATEGY ACTIVE — Fear & Greed Index: ${fearGreedIndex}/100 (${fearGreedLabel}).
- Market is GREEDY. Assets may appreciate. Pay fair value QUICKLY to secure the asset.
- Target 85-95% of estimated value. Be willing to accept early.
- Don't waste rounds — the price might go up if you delay.`;
    } else {
      adaptiveStrategy = `- BALANCED STRATEGY — Fear & Greed Index: ${fearGreedIndex}/100 (${fearGreedLabel}).
- Market is neutral. Standard negotiation at 70-80% of estimated value.`;
    }
  }

  // P6: Agent memory — inject recent trade history
  let memoryBlock = "";
  if (tradeHistory && tradeHistory.length > 0) {
    const recent = tradeHistory.slice(-3);
    const lines = recent.map(
      (t) => `  - ${t.assetName}: settled at $${t.price.toFixed(4)} (${t.timestamp})`
    );
    memoryBlock = `\nTRADE MEMORY (last ${recent.length} trades):\n${lines.join("\n")}
- Learn from these: If past settlements were below estimated value, the seller tends to concede — hold firm.
- If past settlements were at or above estimated value, the seller is tough — consider conceding earlier.\n`;
  }

  // P7: Efficiency learning
  let efficiencyBlock = "";
  if (avgEfficiency != null && avgEfficiency > 0) {
    efficiencyBlock = `\nNEGOTIATION PERFORMANCE: Your average efficiency across past trades is ${(avgEfficiency * 100).toFixed(1)}%. Try to match or beat this benchmark.\n`;
  }

  return `You are BUYER_AGENT in an autonomous M2M settlement protocol.
OUTPUT RULES — ABSOLUTE:
1. Respond with ONLY a single raw JSON object. No markdown, no code fences, no explanation, no text before or after.
2. Every response must parse as valid JSON. If it does not, the system crashes.

CONTEXT:
- Asset: "${assetName}"
- Estimated value: $${estimatedValue.toFixed(2)}
- Market data: ${marketData}
${securityBlock}${ethPriceBlock}${tavilyBlock}${alphaVantageBlock}${ofacBlock}${twapBlock}${memoryBlock}${efficiencyBlock}
STRATEGY:
${adaptiveStrategy}
- Start low, raise incrementally. Never exceed estimated value.${twapCeiling ? `\n- ABSOLUTE CEILING: $${twapCeiling.toFixed(4)} — reject any price above this.` : ""}
- USE the market intelligence above to justify your price reasoning — cite specific data points.
- When the seller's price is within 10% of your target, ACCEPT immediately by setting is_agreed to true.
- For assets valued at $0.01, agree on $0.01 within 1-2 rounds.
- Reference specific data sources (CoinGecko, Tavily, Alpha Vantage, TWAP) in your public_message to show data-driven reasoning.

JSON SCHEMA (respond with this exact shape):
{"public_message":"string","agent_intent":"string","is_agreed":false,"final_price":null}

When accepting: {"public_message":"string","agent_intent":"string","is_agreed":true,"final_price":0.01}`;
}

function buildSellerSystemPrompt(
  assetName: string,
  estimatedValue: number
): string {
  return `You are SELLER_AGENT in an autonomous M2M settlement protocol.
OUTPUT RULES — ABSOLUTE:
1. Respond with ONLY a single raw JSON object. No markdown, no code fences, no explanation, no text before or after.
2. Every response must parse as valid JSON. If it does not, the system crashes.

CONTEXT:
- Asset: "${assetName}"
- Estimated value: $${estimatedValue.toFixed(2)}

STRATEGY:
- Sell as close to estimated value as possible. Minimum is 80% of estimated value.
- Start slightly above, concede slowly.
- If the buyer offers within 15% of estimated value, ACCEPT immediately by setting is_agreed to true.
- For assets valued at $0.01, agree on $0.01 within 1-2 rounds.

JSON SCHEMA (respond with this exact shape):
{"public_message":"string","agent_intent":"string","is_agreed":false,"final_price":null}

When accepting: {"public_message":"string","agent_intent":"string","is_agreed":true,"final_price":0.01}`;
}

// ── POST Handler ──

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "LOCUS_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body: NegotiateRequestBody = await request.json();
    const {
      currentTurn,
      turnNumber,
      assetName,
      estimatedValue,
      messages,
      securityContext,
      ethPrice,
      tavilyContext,
      alphaVantageContext,
      ofacClearance,
      twapCeiling,
      fearGreedIndex,
      fearGreedLabel,
      marketSentiment,
      tradeHistory,
      avgEfficiency,
    } = body;

    // Validate required fields
    if (!currentTurn || !assetName || estimatedValue == null) {
      return NextResponse.json(
        { error: "Missing required fields: currentTurn, assetName, estimatedValue." },
        { status: 400 }
      );
    }

    // ── FEATURE #3: Market Scan on Buyer's first turn ──
    let marketData = "No market scan performed for this turn.";
    if (currentTurn === "BUYER" && turnNumber === 1) {
      marketData = await searchMarketValue(assetName, apiKey);
    }

    // ── Build system prompt based on agent role ──
    const systemPrompt =
      currentTurn === "BUYER"
        ? buildBuyerSystemPrompt(
            assetName,
            estimatedValue,
            marketData,
            securityContext,
            ethPrice,
            tavilyContext,
            alphaVantageContext,
            ofacClearance,
            twapCeiling,
            fearGreedIndex,
            fearGreedLabel,
            marketSentiment,
            tradeHistory,
            avgEfficiency,
          )
        : buildSellerSystemPrompt(assetName, estimatedValue);

    // ── FEATURE #2: Call Locus Wrapped OpenAI for negotiation ──
    const agentResponse = await callLocusLLM(systemPrompt, messages, apiKey);

    return NextResponse.json({
      ...agentResponse,
      turn: currentTurn,
      turnNumber,
      marketData: turnNumber === 1 && currentTurn === "BUYER" ? marketData : undefined,
    });
  } catch (err) {
    console.error("[/api/negotiate] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
