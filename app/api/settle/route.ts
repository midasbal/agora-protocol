import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Protocol Fee Configuration (M3) ──
const PROTOCOL_FEE_PERCENT = 0.05; // 5% protocol fee

// ── Types ──

interface SettleRequestBody {
  agreedPrice: number;
  assetName: string;
  assetId: string;
  /** Buyer agent's API key for two-key settlement (T1) */
  buyerApiKey?: string;
  /** Optional buyer wallet address for the audit receipt */
  buyerWallet?: string;
}

interface SettleResponse {
  success: boolean;
  sessionId: string | null;
  paymentTxHash: string | null;
  amount: string;
  currency: string;
  protocolFee: string;
  sellerNet: string;
  error?: string;
}

// ── STEP 1: Seller creates a Checkout Session ──
// Uses the OPERATOR (seller) API key

async function createCheckoutSession(
  agreedPrice: number,
  assetName: string,
  apiKey: string
): Promise<{ sessionId: string; raw: Record<string, unknown> }> {
  const res = await fetchWithRetry(`${LOCUS_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: agreedPrice.toString(),
      currency: "USDC",
      description: `Agora M2M Settlement for ${assetName}`,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Checkout session creation failed (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();

  const sessionId =
    data?.sessionId ??
    data?.id ??
    data?.data?.sessionId ??
    data?.data?.id ??
    data?.session?.id ??
    null;

  if (!sessionId) {
    throw new Error(
      `Checkout session created but no sessionId found in response: ${JSON.stringify(data)}`
    );
  }

  return { sessionId, raw: data };
}

// ── STEP 2: Buyer pays the Checkout Session (Agent-to-Agent) ──
// Uses the BUYER agent's API key (T1: two-key settlement)

async function payCheckoutSession(
  sessionId: string,
  apiKey: string
): Promise<{ paymentTxHash: string; raw: Record<string, unknown> }> {
  const res = await fetchWithRetry(
    `${LOCUS_BASE}/checkout/agent/pay/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Agent checkout payment failed (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();

  const paymentTxHash =
    data?.transactionHash ??
    data?.txHash ??
    data?.data?.transactionHash ??
    data?.data?.txHash ??
    data?.hash ??
    data?.data?.hash ??
    data?.paymentId ??
    data?.data?.paymentId ??
    null;

  if (!paymentTxHash) {
    console.warn(
      "[/api/settle] Payment succeeded but no txHash found:",
      JSON.stringify(data)
    );
  }

  return {
    paymentTxHash: paymentTxHash ?? `locus-payment-${sessionId}`,
    raw: data,
  };
}

// ── STEP 3: Collect Protocol Fee via MPP Split (M3) ──

// ── Protocol Treasury Wallet (receives 5% fee on every trade) ──
const PROTOCOL_TREASURY_WALLET = process.env.PROTOCOL_TREASURY_WALLET
  ?? process.env.OPERATOR_WALLET_ADDRESS
  ?? "0x624a621f4af50c3f532d6cd7f1088f021ca41621";

async function collectProtocolFee(
  agreedPrice: number,
  apiKey: string
): Promise<{ feeTxHash: string | null; feeAmount: string }> {
  const feeAmount = (agreedPrice * PROTOCOL_FEE_PERCENT).toFixed(2);

  try {
    // Send the protocol fee to the protocol treasury wallet
    // Locus spec: to_address (string), amount (number), memo (string)
    const feeRes = await fetchWithRetry(`${LOCUS_BASE}/pay/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to_address: PROTOCOL_TREASURY_WALLET,
        amount: Number(feeAmount),
        memo: `Agora Protocol Fee (${(PROTOCOL_FEE_PERCENT * 100).toFixed(0)}%) — MPP Split`,
      }),
    });

    if (!feeRes.ok) {
      console.warn(
        `[/api/settle] Protocol fee collection returned ${feeRes.status}. Fee logged but not collected on-chain.`
      );
      return { feeTxHash: null, feeAmount };
    }

    const data = await feeRes.json();
    const feeData = data?.data ?? data;
    const feeTxHash =
      feeData?.transactionHash ??
      feeData?.txHash ??
      feeData?.hash ??
      feeData?.id ??
      null;

    console.log(`[/api/settle] Protocol fee collected: $${feeAmount} USDC — Tx: ${feeTxHash}`);
    return { feeTxHash, feeAmount };
  } catch (err) {
    console.warn("[/api/settle] Protocol fee collection failed (non-blocking):", err);
    return { feeTxHash: null, feeAmount };
  }
}

// ── POST Handler ──

export async function POST(request: NextRequest) {
  try {
    const operatorApiKey = process.env.LOCUS_API_KEY;
    if (!operatorApiKey) {
      return NextResponse.json(
        { error: "LOCUS_API_KEY is not configured." } satisfies Partial<SettleResponse>,
        { status: 500 }
      );
    }

    const body: SettleRequestBody = await request.json();
    const { agreedPrice, assetName, assetId, buyerApiKey, buyerWallet } = body;

    // Validate required fields
    if (!agreedPrice || !assetName || !assetId) {
      return NextResponse.json(
        {
          error: "Missing required fields: agreedPrice, assetName, assetId.",
        } satisfies Partial<SettleResponse>,
        { status: 400 }
      );
    }

    // T1: Use buyer's API key for payment, operator's for session creation
    const paymentApiKey = buyerApiKey || operatorApiKey;

    console.log(
      `[/api/settle] Initiating two-key settlement: ${assetName} (${assetId}) @ $${agreedPrice}`,
      `| Buyer key: ${buyerApiKey ? "provided" : "fallback-to-operator"}`
    );

    // ── STEP 1: Create checkout session (Seller/Operator side) ──
    const { sessionId, raw: sessionData } = await createCheckoutSession(
      agreedPrice,
      assetName,
      operatorApiKey
    );

    console.log(
      `[/api/settle] Checkout session created: ${sessionId}`,
      sessionData
    );

    // ── STEP 2: Pay checkout session (Buyer side — two-key auth) ──
    const { paymentTxHash, raw: paymentData } = await payCheckoutSession(
      sessionId,
      paymentApiKey
    );

    console.log(
      `[/api/settle] Payment completed: ${paymentTxHash}`,
      paymentData
    );

    // ── STEP 3: Collect Protocol Fee (M3 — MPP Split) ──
    const { feeTxHash, feeAmount } = await collectProtocolFee(
      agreedPrice,
      operatorApiKey
    );

    const sellerNet = (agreedPrice - parseFloat(feeAmount)).toFixed(2);

    // ── Return success ──
    const response: SettleResponse = {
      success: true,
      sessionId,
      paymentTxHash,
      amount: agreedPrice.toString(),
      currency: "USDC",
      protocolFee: feeAmount,
      sellerNet,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/settle] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    const response: SettleResponse = {
      success: false,
      sessionId: null,
      paymentTxHash: null,
      amount: "0",
      currency: "USDC",
      protocolFee: "0",
      sellerNet: "0",
      error: message,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
