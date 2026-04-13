import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface VirusTotalResponse {
  success: boolean;
  domain: string;
  safe: boolean;
  summary: string;
  error?: string;
}

// ── POST Handler: Pre-Trade Domain Threat Intelligence via VirusTotal ──

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          domain: "",
          safe: false,
          summary: "",
          error: "LOCUS_API_KEY is not configured.",
        } satisfies VirusTotalResponse,
        { status: 500 }
      );
    }

    const body = await request.json();
    const { domain } = body as { domain?: string };

    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          domain: "",
          safe: false,
          summary: "",
          error: "Missing required field: domain.",
        } satisfies VirusTotalResponse,
        { status: 400 }
      );
    }

    console.log(
      `[/api/intel/virustotal] Scanning domain: ${domain}`
    );

    // ── Call Locus Wrapped VirusTotal Domain Report ──
    const vtRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/virustotal/domain-report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ domain }),
      }
    );

    if (!vtRes.ok) {
      const errorText = await vtRes.text();
      console.error(
        `[/api/intel/virustotal] VirusTotal API error (${vtRes.status}):`,
        errorText
      );

      // Gracefully degrade — don't block the trade on VT failure
      return NextResponse.json({
        success: true,
        domain,
        safe: true,
        summary: `VirusTotal scan returned status ${vtRes.status}. Proceeding with caution — no threats confirmed.`,
      } satisfies VirusTotalResponse);
    }

    const data = await vtRes.json();
    const vtData = data?.data ?? data;

    // Extract threat metrics from various response shapes
    const malicious =
      vtData?.attributes?.last_analysis_stats?.malicious ??
      vtData?.last_analysis_stats?.malicious ??
      vtData?.malicious ??
      0;
    const suspicious =
      vtData?.attributes?.last_analysis_stats?.suspicious ??
      vtData?.last_analysis_stats?.suspicious ??
      vtData?.suspicious ??
      0;
    const harmless =
      vtData?.attributes?.last_analysis_stats?.harmless ??
      vtData?.last_analysis_stats?.harmless ??
      vtData?.harmless ??
      0;
    const undetected =
      vtData?.attributes?.last_analysis_stats?.undetected ??
      vtData?.last_analysis_stats?.undetected ??
      vtData?.undetected ??
      0;

    const totalEngines = malicious + suspicious + harmless + undetected;
    const isSafe = malicious === 0 && suspicious === 0;

    const reputation =
      vtData?.attributes?.reputation ?? vtData?.reputation ?? "N/A";

    const summary = isSafe
      ? `Domain "${domain}" is CLEAN. ${totalEngines > 0 ? `${totalEngines} security engines scanned — 0 threats detected.` : "No threats detected."} Reputation score: ${reputation}.`
      : `⚠ Domain "${domain}" flagged: ${malicious} malicious, ${suspicious} suspicious detections out of ${totalEngines} engines. Reputation: ${reputation}.`;

    console.log(`[/api/intel/virustotal] Result: ${summary}`);

    const response: VirusTotalResponse = {
      success: true,
      domain,
      safe: isSafe,
      summary,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/intel/virustotal] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    // Graceful degradation — don't block negotiation
    return NextResponse.json({
      success: true,
      domain: "",
      safe: true,
      summary: `VirusTotal scan encountered an error: ${message}. Proceeding with caution.`,
    } satisfies VirusTotalResponse);
  }
}
