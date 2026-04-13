import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface FundRequest {
  walletAddress: string;
  amount: number;
}

interface FundResponse {
  success: boolean;
  txHash: string | null;
  amount: string;
  currency: string;
  recipientAddress: string | null;
  locusStatus?: string;
  transactionId?: string | null;
  error?: string;
}

// ── POST Handler: Fund the Buyer Agent wallet via Locus Pay Send ──

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          txHash: null,
          amount: "0",
          currency: "USDC",
          recipientAddress: null,
          error: "LOCUS_API_KEY is not configured.",
        } satisfies FundResponse,
        { status: 500 }
      );
    }

    const body: FundRequest = await request.json();
    const { walletAddress, amount } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json(
        {
          success: false,
          txHash: null,
          amount: "0",
          currency: "USDC",
          recipientAddress: null,
          error: "Missing required fields: walletAddress, amount.",
        } satisfies FundResponse,
        { status: 400 }
      );
    }

    console.log(
      `[/api/agent/fund] Funding ${walletAddress} with $${amount} USDC via Locus Pay Send`
    );

    // ── Call Locus Pay Send API ──
    // Locus spec: to_address (string), amount (number), memo (string)
    const sendRes = await fetchWithRetry(`${LOCUS_BASE}/pay/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to_address: walletAddress,
        amount: Number(amount),
        memo: `Agora Protocol — Funding Buyer Agent ${walletAddress.slice(0, 8)}`,
      }),
    });

    if (!sendRes.ok) {
      const errorText = await sendRes.text();
      throw new Error(
        `Locus Pay Send failed (${sendRes.status}): ${errorText}`
      );
    }

    const data = await sendRes.json();
    const sendData = data?.data ?? data;

    // Extract tx hash from various response shapes
    const txHash =
      sendData?.transactionHash ??
      sendData?.txHash ??
      sendData?.hash ??
      sendData?.id ??
      sendData?.transaction_id ??
      sendData?.paymentId ??
      null;

    // Extract Locus queue status — pay/send returns 202 with "status": "QUEUED"
    const locusStatus =
      sendData?.status ?? "UNKNOWN";

    const transactionId =
      sendData?.transaction_id ?? sendData?.transactionId ?? txHash ?? null;

    console.log(
      `[/api/agent/fund] Fund transfer queued: ${txHash ?? "no-hash"} | status: ${locusStatus}`,
      data
    );

    const response: FundResponse = {
      success: true,
      txHash: txHash ?? `locus-fund-${Date.now()}`,
      amount: amount.toString(),
      currency: "USDC",
      recipientAddress: walletAddress,
      locusStatus,
      transactionId,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/agent/fund] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    const response: FundResponse = {
      success: false,
      txHash: null,
      amount: "0",
      currency: "USDC",
      recipientAddress: null,
      error: message,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
