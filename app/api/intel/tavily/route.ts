import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface TavilyRequest {
  query: string;
}

interface TavilyResponse {
  success: boolean;
  summary: string;
  sources: { title: string; url: string; snippet: string }[];
  error?: string;
}

// ── POST Handler: Real-time web search via Locus Wrapped Tavily ──

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          summary: "",
          sources: [],
          error: "LOCUS_API_KEY is not configured.",
        } satisfies TavilyResponse,
        { status: 500 }
      );
    }

    const body: TavilyRequest = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          summary: "",
          sources: [],
          error: "Missing required field: query.",
        } satisfies TavilyResponse,
        { status: 400 }
      );
    }

    console.log(`[/api/intel/tavily] Searching: "${query}"`);

    // ── Call Locus Wrapped Tavily Search ──
    const tavilyRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/tavily/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: "basic",
          max_results: 3,
          include_answer: true,
        }),
      }
    );

    if (!tavilyRes.ok) {
      const errorText = await tavilyRes.text();
      console.warn(
        `[/api/intel/tavily] Tavily API returned ${tavilyRes.status}: ${errorText}`
      );
      return NextResponse.json({
        success: true,
        summary: `Web search unavailable (status ${tavilyRes.status}). Using baseline pricing.`,
        sources: [],
      } satisfies TavilyResponse);
    }

    const data = await tavilyRes.json();
    const tavilyData = data?.data ?? data;

    // Extract answer and results
    const answer = tavilyData?.answer ?? tavilyData?.summary ?? null;
    const results = tavilyData?.results ?? tavilyData?.organic ?? [];

    const sources = results.slice(0, 3).map(
      (r: { title?: string; url?: string; content?: string; snippet?: string }) => ({
        title: r.title ?? "Untitled",
        url: r.url ?? "",
        snippet: (r.content ?? r.snippet ?? "").slice(0, 200),
      })
    );

    const summary = answer
      ? `Tavily Web Intel: ${answer.slice(0, 400)}`
      : sources.length > 0
        ? `Tavily found ${sources.length} relevant results for "${query}".`
        : "No relevant web results found.";

    console.log(`[/api/intel/tavily] Found ${sources.length} results`);

    const response: TavilyResponse = {
      success: true,
      summary,
      sources,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/intel/tavily] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({
      success: true,
      summary: `Web search error: ${message}. Proceeding with available data.`,
      sources: [],
      error: message,
    } satisfies TavilyResponse);
  }
}
