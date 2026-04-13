import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ══════════════════════════════════════════════════════════════════════
// TWAP (Time-Weighted Average Price) Oracle
// ──────────────────────────────────────────────────────────────────────
// Fetches 7-day historical ETH price data via Locus Wrapped CoinGecko
// and computes a TWAP to serve as a hard price ceiling in negotiation.
// ══════════════════════════════════════════════════════════════════════

const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

export async function POST() {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "LOCUS_API_KEY not configured." },
        { status: 500 }
      );
    }

    console.log("[/api/intel/twap] Fetching 7-day historical ETH prices ...");

    // ── Call Locus Wrapped CoinGecko — market chart for last 7 days ──
    const cgRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/coingecko/coins-market-chart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          id: "ethereum",
          vs_currency: "usd",
          days: 7,
        }),
      }
    );

    if (!cgRes.ok) {
      const errorText = await cgRes.text();
      console.warn(`[/api/intel/twap] CoinGecko returned ${cgRes.status}: ${errorText}`);

      // Fallback: use the simple price endpoint for a single-point TWAP
      const fallbackRes = await fetchWithRetry(
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
          }),
        }
      );

      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        const fbRaw = fbData?.data ?? fbData;
        const price = fbRaw?.ethereum?.usd ?? null;
        if (price) {
          return NextResponse.json({
            success: true,
            twapUsd: price,
            dataPoints: 1,
            periodDays: 0,
            high7d: price,
            low7d: price,
            summary: `TWAP fallback: Current ETH spot = $${price.toFixed(2)} (historical data unavailable).`,
          });
        }
      }

      return NextResponse.json({
        success: false,
        twapUsd: null,
        dataPoints: 0,
        periodDays: 7,
        summary: `CoinGecko historical endpoint unavailable (${cgRes.status}). TWAP not computed.`,
      });
    }

    const data = await cgRes.json();
    const rawData = data?.data ?? data;
    const prices: [number, number][] = rawData?.prices ?? [];

    if (prices.length === 0) {
      return NextResponse.json({
        success: true,
        twapUsd: null,
        dataPoints: 0,
        periodDays: 7,
        summary: "CoinGecko returned no historical price data. TWAP unavailable.",
      });
    }

    // Compute TWAP
    const sum = prices.reduce((acc, [, p]) => acc + p, 0);
    const twap = sum / prices.length;
    const high = Math.max(...prices.map(([, p]) => p));
    const low = Math.min(...prices.map(([, p]) => p));
    const latest = prices[prices.length - 1][1];
    const oldest = prices[0][1];
    const change7d = ((latest - oldest) / oldest) * 100;

    const summary = `7-Day TWAP: $${twap.toFixed(2)} | High: $${high.toFixed(2)} | Low: $${low.toFixed(2)} | 7d Change: ${change7d >= 0 ? "+" : ""}${change7d.toFixed(1)}% | ${prices.length} data points.`;

    console.log(`[/api/intel/twap] ${summary}`);

    return NextResponse.json({
      success: true,
      twapUsd: parseFloat(twap.toFixed(2)),
      high7d: parseFloat(high.toFixed(2)),
      low7d: parseFloat(low.toFixed(2)),
      change7d: parseFloat(change7d.toFixed(2)),
      latestPrice: parseFloat(latest.toFixed(2)),
      dataPoints: prices.length,
      periodDays: 7,
      summary,
    });
  } catch (err) {
    console.error("[/api/intel/twap] Error:", err);
    return NextResponse.json({
      success: false,
      twapUsd: null,
      dataPoints: 0,
      periodDays: 7,
      summary: `TWAP computation error: ${err instanceof Error ? err.message : "Unknown"}.`,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}
