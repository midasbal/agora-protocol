import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ══════════════════════════════════════════════════════════════════════
// Firecrawl Asset Discovery
// ──────────────────────────────────────────────────────────────────────
// Scrapes a target URL via Locus Wrapped Firecrawl to discover
// tradeable digital assets. Returns an array of AssetOption-compatible
// objects that the frontend can merge into its dynamic asset list.
// ══════════════════════════════════════════════════════════════════════

const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

interface DiscoveredAsset {
  id: string;
  label: string;
  name: string;
  type: string;
  network: string;
  estimatedValue: string;
  numericValue: number;
  meta?: { key: string; value: string }[];
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, assets: [], error: "LOCUS_API_KEY not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { url } = body as { url?: string };
    const targetUrl = url || "https://docs.locus.finance";

    console.log(`[/api/discovery/firecrawl] Scraping: ${targetUrl}`);

    // ── Call Locus Wrapped Firecrawl ──
    const fcRes = await fetchWithRetry(`${LOCUS_BASE}/wrapped/firecrawl/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ["markdown"],
      }),
    });

    let pageContent = "";
    let scrapedTitle = targetUrl;

    if (fcRes.ok) {
      const fcData = await fcRes.json();
      const result = fcData?.data ?? fcData;
      pageContent = result?.markdown ?? result?.content ?? result?.text ?? "";
      scrapedTitle = result?.metadata?.title ?? result?.title ?? targetUrl;
      console.log(`[/api/discovery/firecrawl] Scraped ${pageContent.length} chars from "${scrapedTitle}"`);
    } else {
      const errText = await fcRes.text();
      console.warn(`[/api/discovery/firecrawl] Firecrawl returned ${fcRes.status}: ${errText}`);
    }

    // ── Use LLM to extract tradeable assets from the scraped content ──
    const llmRes = await fetchWithRetry(`${LOCUS_BASE}/wrapped/openai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an asset discovery engine. Given scraped web content, identify 2-4 tradeable digital assets (APIs, datasets, compute credits, SaaS services, etc.) that could be bought/sold by autonomous agents.

OUTPUT: Respond with ONLY a JSON array. No markdown, no code fences, no explanation.

Each item: {"id":"slug-id","label":"Short label (max 50 chars)","name":"Full asset name","type":"Category (e.g. API Credit, Data Feed, Compute)","estimatedValue":"~$0.01","numericValue":0.01,"meta":[{"key":"Source","value":"discovered"}]}

If you cannot identify any, return an empty array: []`,
          },
          {
            role: "user",
            content: `Source URL: ${targetUrl}\nTitle: ${scrapedTitle}\n\nContent (truncated to 3000 chars):\n${pageContent.slice(0, 3000)}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.warn(`[/api/discovery/firecrawl] LLM extraction failed: ${errText}`);
      return NextResponse.json({
        success: true,
        assets: [],
        source: targetUrl,
        title: scrapedTitle,
        summary: `Firecrawl scraped ${pageContent.length} chars but LLM extraction failed.`,
      });
    }

    const llmData = await llmRes.json();
    const raw =
      llmData?.choices?.[0]?.message?.content ??
      llmData?.data?.choices?.[0]?.message?.content ??
      "[]";

    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
    const cleaned = (jsonMatch[1] ?? raw).trim();

    let discoveredAssets: DiscoveredAsset[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      discoveredAssets = (Array.isArray(parsed) ? parsed : []).map(
        (a: Record<string, unknown>, i: number) => ({
          id: (a.id as string) || `discovered-${i}`,
          label: (a.label as string) || `Discovered Asset ${i + 1}`,
          name: (a.name as string) || `Discovered Asset ${i + 1}`,
          type: (a.type as string) || "Discovered",
          network: "Base",
          estimatedValue: (a.estimatedValue as string) || "~$0.01",
          numericValue: typeof a.numericValue === "number" ? a.numericValue : 0.01,
          meta: Array.isArray(a.meta) ? a.meta as { key: string; value: string }[] : [{ key: "Source", value: targetUrl }],
          source: targetUrl,
        })
      );
    } catch {
      console.warn("[/api/discovery/firecrawl] Failed to parse LLM output:", cleaned);
    }

    return NextResponse.json({
      success: true,
      assets: discoveredAssets,
      source: targetUrl,
      title: scrapedTitle,
      summary: `Discovered ${discoveredAssets.length} tradeable asset(s) from "${scrapedTitle}".`,
    });
  } catch (err) {
    console.error("[/api/discovery/firecrawl] Error:", err);
    return NextResponse.json(
      {
        success: false,
        assets: [],
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
