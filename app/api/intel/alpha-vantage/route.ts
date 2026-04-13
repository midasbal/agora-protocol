import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface AlphaVantageResponse {
  success: boolean;
  fearGreedIndex: number | null;
  fearGreedLabel: string | null;
  btcPrice: number | null;
  marketSentiment: string;
  summary: string;
  error?: string;
}

// ── POST Handler: Fetch market sentiment via Locus Wrapped Alpha Vantage ──

export async function POST() {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          fearGreedIndex: null,
          fearGreedLabel: null,
          btcPrice: null,
          marketSentiment: "",
          summary: "",
          error: "LOCUS_API_KEY is not configured.",
        } satisfies AlphaVantageResponse,
        { status: 500 }
      );
    }

    console.log("[/api/intel/alpha-vantage] Fetching crypto market sentiment ...");

    // ── Call Locus Wrapped Alpha Vantage — Crypto Rating / News Sentiment ──
    // Try the crypto overview endpoint for BTC to get market context
    const avRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/alpha-vantage/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          function: "NEWS_SENTIMENT",
          tickers: "CRYPTO:BTC",
          limit: 5,
        }),
      }
    );

    if (!avRes.ok) {
      const errorText = await avRes.text();
      console.warn(
        `[/api/intel/alpha-vantage] API returned ${avRes.status}: ${errorText}`
      );

      return NextResponse.json({
        success: true,
        fearGreedIndex: null,
        fearGreedLabel: null,
        btcPrice: null,
        marketSentiment: "neutral",
        summary: `Alpha Vantage unavailable (${avRes.status}). Market sentiment defaulting to neutral.`,
      } satisfies AlphaVantageResponse);
    }

    const data = await avRes.json();
    const avData = data?.data ?? data;

    // Parse sentiment from news sentiment response
    const sentimentScore =
      avData?.sentiment_score_definition ??
      avData?.overall_sentiment_score ??
      null;

    const feed = avData?.feed ?? [];
    let avgSentiment = 0;
    let sentimentCount = 0;

    for (const item of feed.slice(0, 5)) {
      const tickerSentiment = item?.ticker_sentiment ?? [];
      for (const ts of tickerSentiment) {
        if (
          ts?.ticker === "CRYPTO:BTC" ||
          ts?.ticker === "BTC" ||
          ts?.ticker?.includes("CRYPTO")
        ) {
          const score = parseFloat(ts?.ticker_sentiment_score ?? "0");
          if (!isNaN(score)) {
            avgSentiment += score;
            sentimentCount++;
          }
        }
      }
    }

    // Normalize to 0-100 Fear & Greed scale
    const normalizedSentiment =
      sentimentCount > 0 ? avgSentiment / sentimentCount : 0;
    // Alpha Vantage scores: -1 (bearish) to +1 (bullish) → map to 0-100
    const fearGreedIndex = Math.round((normalizedSentiment + 1) * 50);

    let fearGreedLabel: string;
    let marketSentiment: string;
    if (fearGreedIndex <= 20) {
      fearGreedLabel = "Extreme Fear";
      marketSentiment = "bearish";
    } else if (fearGreedIndex <= 40) {
      fearGreedLabel = "Fear";
      marketSentiment = "bearish";
    } else if (fearGreedIndex <= 60) {
      fearGreedLabel = "Neutral";
      marketSentiment = "neutral";
    } else if (fearGreedIndex <= 80) {
      fearGreedLabel = "Greed";
      marketSentiment = "bullish";
    } else {
      fearGreedLabel = "Extreme Greed";
      marketSentiment = "bullish";
    }

    const headlineCount = feed.length;
    const summary = `Alpha Vantage Crypto Sentiment: ${fearGreedLabel} (${fearGreedIndex}/100) — ${headlineCount} headlines analyzed. Market: ${marketSentiment}.`;

    console.log(`[/api/intel/alpha-vantage] ${summary}`);

    const response: AlphaVantageResponse = {
      success: true,
      fearGreedIndex,
      fearGreedLabel,
      btcPrice: null, // would need separate endpoint
      marketSentiment,
      summary,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/intel/alpha-vantage] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({
      success: true,
      fearGreedIndex: null,
      fearGreedLabel: null,
      btcPrice: null,
      marketSentiment: "neutral",
      summary: `Alpha Vantage error: ${message}. Defaulting to neutral sentiment.`,
      error: message,
    } satisfies AlphaVantageResponse);
  }
}
