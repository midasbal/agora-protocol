import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface PriceResponse {
  success: boolean;
  ethPriceUsd: number | null;
  summary: string;
  error?: string;
}

// ── POST Handler: Fetch live ETH price via Locus Wrapped CoinGecko ──

export async function POST() {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          ethPriceUsd: null,
          summary: "",
          error: "LOCUS_API_KEY is not configured.",
        } satisfies PriceResponse,
        { status: 500 }
      );
    }

    console.log("[/api/intel/price] Fetching live ETH price via CoinGecko");

    // ── Call Locus Wrapped CoinGecko Simple Price ──
    const cgRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/coingecko/simple-price`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ids: "ethereum",
          vs_currencies: "usd",
          include_24hr_change: true,
          include_market_cap: true,
        }),
      }
    );

    if (!cgRes.ok) {
      const errorText = await cgRes.text();
      console.error(
        `[/api/intel/price] CoinGecko API error (${cgRes.status}):`,
        errorText
      );

      // Graceful degradation — return a fallback without blocking
      return NextResponse.json({
        success: true,
        ethPriceUsd: null,
        summary: `CoinGecko returned status ${cgRes.status}. Live ETH price unavailable — using estimated value only.`,
      } satisfies PriceResponse);
    }

    const data = await cgRes.json();
    const cgData = data?.data ?? data;

    // Extract ETH price from various response shapes
    const ethData =
      cgData?.ethereum ?? cgData?.ETH ?? cgData;
    const ethPriceUsd: number | null =
      ethData?.usd ??
      ethData?.price ??
      ethData?.current_price ??
      (typeof ethData === "number" ? ethData : null);

    const change24h =
      ethData?.usd_24h_change ??
      ethData?.price_change_percentage_24h ??
      null;

    const marketCap =
      ethData?.usd_market_cap ??
      ethData?.market_cap ??
      null;

    const changeStr = change24h != null
      ? ` | 24h change: ${change24h > 0 ? "+" : ""}${Number(change24h).toFixed(2)}%`
      : "";
    const mcapStr = marketCap != null
      ? ` | Market cap: $${(Number(marketCap) / 1e9).toFixed(1)}B`
      : "";

    const summary = ethPriceUsd != null
      ? `ETH/USD: $${ethPriceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${changeStr}${mcapStr}`
      : "ETH price data received but could not be parsed.";

    console.log(`[/api/intel/price] ${summary}`);

    const response: PriceResponse = {
      success: true,
      ethPriceUsd,
      summary,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/intel/price] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({
      success: true,
      ethPriceUsd: null,
      summary: `CoinGecko fetch error: ${message}. Proceeding without live ETH price.`,
    } satisfies PriceResponse);
  }
}
