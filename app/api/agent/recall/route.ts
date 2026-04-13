import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface RecallRequest {
  /** The buyer agent's API key (used to authorize the send) */
  buyerApiKey: string;
  /** The operator's wallet address to send funds back to */
  operatorWalletAddress: string;
  /** Amount to recall in USDC */
  amount: number;
}

interface RecallResponse {
  success: boolean;
  txHash: string | null;
  amount: string;
  error?: string;
}

// ── POST Handler: Recall funds from Buyer Agent back to Operator ──

export async function POST(request: NextRequest) {
  try {
    const body: RecallRequest = await request.json();
    const { buyerApiKey, operatorWalletAddress, amount } = body;

    if (!buyerApiKey || !operatorWalletAddress || !amount) {
      return NextResponse.json(
        {
          success: false,
          txHash: null,
          amount: "0",
          error: "Missing required fields: buyerApiKey, operatorWalletAddress, amount.",
        } satisfies RecallResponse,
        { status: 400 }
      );
    }

    console.log(
      `[/api/agent/recall] Recalling $${amount} USDC from buyer agent → ${operatorWalletAddress}`
    );

    // Step 1: Verify buyer agent balance first
    const balRes = await fetchWithRetry(`${LOCUS_BASE}/pay/balance`, {
      method: "GET",
      headers: { Authorization: `Bearer ${buyerApiKey}` },
    });

    let currentBalance = "0.00";
    if (balRes.ok) {
      const balData = await balRes.json();
      const bd = balData?.data ?? balData;
      currentBalance =
        bd?.balance ?? bd?.amount ?? bd?.availableBalance ?? "0.00";
      console.log(`[/api/agent/recall] Buyer agent balance: $${currentBalance}`);
    }

    const balNum = parseFloat(currentBalance);
    if (balNum <= 0) {
      return NextResponse.json({
        success: false,
        txHash: null,
        amount: "0",
        error: `Buyer agent wallet has $${currentBalance} — nothing to recall.`,
      } satisfies RecallResponse);
    }

    // Use the lesser of requested amount or actual balance
    const recallAmount = Math.min(amount, balNum);

    // Step 2: Send funds back to operator using buyer agent's API key
    const sendRes = await fetchWithRetry(`${LOCUS_BASE}/pay/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerApiKey}`,
      },
      body: JSON.stringify({
        to_address: operatorWalletAddress,
        amount: recallAmount,
        memo: "Agora Protocol — Recall funds to Operator wallet",
      }),
    });

    if (!sendRes.ok) {
      const errorText = await sendRes.text();
      throw new Error(
        `Recall send failed (${sendRes.status}): ${errorText}`
      );
    }

    const data = await sendRes.json();
    const sendData = data?.data ?? data;

    const txHash =
      sendData?.transactionHash ??
      sendData?.txHash ??
      sendData?.hash ??
      sendData?.id ??
      sendData?.paymentId ??
      null;

    console.log(
      `[/api/agent/recall] Recall completed: $${recallAmount} USDC — Tx: ${txHash ?? "no-hash"}`,
      data
    );

    return NextResponse.json({
      success: true,
      txHash: txHash ?? `recall-${Date.now()}`,
      amount: recallAmount.toString(),
    } satisfies RecallResponse);
  } catch (err) {
    console.error("[/api/agent/recall] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        txHash: null,
        amount: "0",
        error: message,
      } satisfies RecallResponse,
      { status: 500 }
    );
  }
}
