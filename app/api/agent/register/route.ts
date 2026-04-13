import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface RegisterResponse {
  success: boolean;
  apiKey: string | null;
  walletAddress: string | null;
  walletId: string | null;
  walletStatus: string;
  claimUrl: string | null;
  defaults: {
    allowanceUsdc: string;
    maxAllowedTxnSizeUsdc: string;
    chain: string;
  } | null;
  error?: string;
}

// ── POST Handler: Self-Register a new Buyer Agent ──

export async function POST() {
  try {
    // Step 1: Call Locus Beta self-registration endpoint
    console.log("[/api/agent/register] Registering autonomous buyer agent ...");

    const registerRes = await fetchWithRetry(`${LOCUS_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Agora-Buyer-${Date.now()}`,
        email: `agora-buyer-${Date.now()}@agora-protocol.ai`,
      }),
    });

    if (!registerRes.ok) {
      const errorText = await registerRes.text();
      throw new Error(
        `Agent registration failed (${registerRes.status}): ${errorText}`
      );
    }

    const data = await registerRes.json();

    // Extract fields from various possible response shapes
    const agentData = data?.data ?? data;

    const apiKey =
      agentData?.apiKey ?? agentData?.api_key ?? null;
    const walletId =
      agentData?.walletId ?? agentData?.wallet_id ?? null;
    const walletStatus =
      agentData?.walletStatus ?? agentData?.wallet_status ?? "unknown";
    const claimUrl =
      agentData?.claimUrl ?? agentData?.claim_url ?? null;
    const ownerAddress =
      agentData?.ownerAddress ?? agentData?.owner_address ?? null;
    const defaults = agentData?.defaults ?? null;

    if (!apiKey) {
      throw new Error(
        `Agent registration succeeded but no API key returned: ${JSON.stringify(data)}`
      );
    }

    console.log(
      `[/api/agent/register] Agent registered. Wallet status: ${walletStatus}`
    );

    // Step 2: Poll for wallet deployment (up to 15 seconds)
    let walletAddress: string | null = ownerAddress;
    let finalStatus = walletStatus;

    if (walletStatus === "deploying" || !walletAddress) {
      console.log("[/api/agent/register] Polling for wallet deployment ...");

      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((r) => setTimeout(r, 1500));

        try {
          const statusRes = await fetch(`${LOCUS_BASE}/status`, {
            method: "GET",
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const sData = statusData?.data ?? statusData;

            const currentStatus =
              sData?.walletStatus ??
              sData?.wallet_status ??
              sData?.status ??
              "deploying";
            const addr =
              sData?.walletAddress ??
              sData?.wallet_address ??
              sData?.address ??
              null;

            if (currentStatus === "deployed" || addr) {
              walletAddress = addr ?? walletAddress;
              finalStatus = "deployed";
              console.log(
                `[/api/agent/register] Wallet deployed: ${walletAddress}`
              );
              break;
            }

            finalStatus = currentStatus;
          }
        } catch {
          // Continue polling on failure
        }
      }
    }

    const response: RegisterResponse = {
      success: true,
      apiKey,
      walletAddress,
      walletId,
      walletStatus: finalStatus,
      claimUrl,
      defaults,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/agent/register] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    const response: RegisterResponse = {
      success: false,
      apiKey: null,
      walletAddress: null,
      walletId: null,
      walletStatus: "failed",
      claimUrl: null,
      defaults: null,
      error: message,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
