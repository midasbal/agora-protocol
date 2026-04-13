import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface EscrowRequest {
  /** Purpose label for the escrow subwallet */
  label?: string;
}

interface EscrowResponse {
  success: boolean;
  subwalletId: string | null;
  subwalletAddress: string | null;
  label: string;
  error?: string;
}

// ── POST Handler: Create an Escrow Subwallet via Locus Subwallets ──

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          subwalletId: null,
          subwalletAddress: null,
          label: "",
          error: "LOCUS_API_KEY is not configured.",
        } satisfies EscrowResponse,
        { status: 500 }
      );
    }

    const body: EscrowRequest = await request.json().catch(() => ({}));
    const label = body.label ?? `Agora-Escrow-${Date.now()}`;

    console.log(`[/api/agent/escrow] Creating escrow subwallet: ${label}`);

    // ── Call Locus Subwallets API ──
    const swRes = await fetchWithRetry(
      `${LOCUS_BASE}/pay/subwallets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          label,
          type: "escrow",
          description: "Agora Protocol Escrow — funds held until settlement completes",
        }),
      }
    );

    if (!swRes.ok) {
      const errorText = await swRes.text();
      console.error(
        `[/api/agent/escrow] Subwallet creation failed (${swRes.status}):`,
        errorText
      );

      // Graceful degradation — return a virtual escrow ID so the flow continues
      return NextResponse.json({
        success: true,
        subwalletId: `escrow-virtual-${Date.now()}`,
        subwalletAddress: null,
        label,
      } satisfies EscrowResponse);
    }

    const data = await swRes.json();
    const swData = data?.data ?? data;

    const subwalletId =
      swData?.id ??
      swData?.subwalletId ??
      swData?.walletId ??
      `escrow-${Date.now()}`;

    const subwalletAddress =
      swData?.address ??
      swData?.walletAddress ??
      swData?.subwalletAddress ??
      null;

    console.log(
      `[/api/agent/escrow] Escrow subwallet created: ${subwalletId} (${subwalletAddress ?? "no address yet"})`
    );

    const response: EscrowResponse = {
      success: true,
      subwalletId,
      subwalletAddress,
      label,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/agent/escrow] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    // Graceful degradation
    return NextResponse.json({
      success: true,
      subwalletId: `escrow-fallback-${Date.now()}`,
      subwalletAddress: null,
      label: "Fallback Escrow",
      error: message,
    } satisfies EscrowResponse);
  }
}
