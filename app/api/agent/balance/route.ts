import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface BalanceResponse {
  success: boolean;
  balance: string | null;
  currency: string;
  walletAddress: string | null;
  error?: string;
}

// ── POST Handler: Fetch real-time USDC balance for a given agent ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey: rawApiKey } = body as { apiKey?: string };

    if (!rawApiKey) {
      return NextResponse.json(
        {
          success: false,
          balance: null,
          currency: "USDC",
          walletAddress: null,
          error: "Missing required field: apiKey",
        } satisfies BalanceResponse,
        { status: 400 }
      );
    }

    // If "__MAIN__" is passed, use the operator's main API key from env
    const apiKey = rawApiKey === "__MAIN__"
      ? process.env.LOCUS_API_KEY
      : rawApiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          balance: null,
          currency: "USDC",
          walletAddress: null,
          error: "LOCUS_API_KEY is not configured.",
        } satisfies BalanceResponse,
        { status: 500 }
      );
    }

    const balanceRes = await fetchWithRetry(`${LOCUS_BASE}/pay/balance`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!balanceRes.ok) {
      const errorText = await balanceRes.text();
      throw new Error(
        `Balance fetch failed (${balanceRes.status}): ${errorText}`
      );
    }

    const data = await balanceRes.json();
    console.log("[/api/agent/balance] Raw Locus response:", JSON.stringify(data));
    const balanceData = data?.data ?? data;

    // Extract balance from various possible response shapes
    // Locus returns: { success: true, data: { usdc_balance: "2.265", wallet_address: "0x..." } }
    const balance =
      balanceData?.usdc_balance ??
      balanceData?.balance ??
      balanceData?.amount ??
      balanceData?.availableBalance ??
      balanceData?.available ??
      (typeof balanceData === "string" ? balanceData : null) ??
      (typeof balanceData === "number" ? balanceData.toString() : null) ??
      "0.00";

    const walletAddress =
      balanceData?.walletAddress ??
      balanceData?.wallet_address ??
      balanceData?.address ??
      null;

    console.log(`[/api/agent/balance] Parsed — balance: ${balance}, walletAddress: ${walletAddress}, isMain: ${rawApiKey === "__MAIN__"}`);

    const response: BalanceResponse = {
      success: true,
      balance: typeof balance === "number" ? balance.toFixed(2) : String(balance),
      currency: "USDC",
      walletAddress,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/agent/balance] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    const response: BalanceResponse = {
      success: false,
      balance: null,
      currency: "USDC",
      walletAddress: null,
      error: message,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
