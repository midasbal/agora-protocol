import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

// ── Locus Beta API base URL ──
const LOCUS_BASE = "https://beta-api.paywithlocus.com/api";

// ── Types ──

interface GenerateImageRequest {
  assetName: string;
  assetType: string;
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl: string | null;
  imageBase64: string | null;
  prompt: string;
  model: string;
  error?: string;
}

// ── POST Handler: Generate an AI image as post-settlement deliverable ──

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LOCUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          imageUrl: null,
          imageBase64: null,
          prompt: "",
          model: "",
          error: "LOCUS_API_KEY is not configured.",
        } satisfies GenerateImageResponse,
        { status: 500 }
      );
    }

    const body: GenerateImageRequest = await request.json();
    const { assetName, assetType } = body;

    if (!assetName) {
      return NextResponse.json(
        {
          success: false,
          imageUrl: null,
          imageBase64: null,
          prompt: "",
          model: "",
          error: "Missing required field: assetName.",
        } satisfies GenerateImageResponse,
        { status: 400 }
      );
    }

    // Build a creative prompt based on the asset
    const prompt = `Futuristic digital certificate for "${assetName}" (${assetType || "Digital Asset"}). Cyber-noir aesthetic with neon green and deep black. Hexagonal grid patterns, holographic seal, blockchain circuit board motifs. Text overlay: "VERIFIED". Ultra-detailed, glowing edges, dark background. Digital art style.`;

    console.log(
      `[/api/intel/generate-image] Generating deliverable for: ${assetName}`
    );

    // ── Try Locus Wrapped Stability AI ──
    const stabilityRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/stability-ai/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            { text: prompt, weight: 1 },
          ],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (stabilityRes.ok) {
      const data = await stabilityRes.json();
      const stData = data?.data ?? data;

      // Extract image from various possible response shapes
      const artifacts = stData?.artifacts ?? stData?.images ?? [];
      const firstImage = artifacts[0];

      if (firstImage) {
        const imageBase64 = firstImage.base64 ?? firstImage.image ?? null;
        const imageUrl = firstImage.url ?? null;

        console.log("[/api/intel/generate-image] Stability AI image generated successfully");

        return NextResponse.json({
          success: true,
          imageUrl,
          imageBase64: imageBase64 ? `data:image/png;base64,${imageBase64}` : null,
          prompt,
          model: "Stability AI (SDXL)",
        } satisfies GenerateImageResponse);
      }
    }

    // ── Fallback: Try Locus Wrapped fal.ai ──
    console.log("[/api/intel/generate-image] Stability AI unavailable, trying fal.ai ...");

    const falRes = await fetchWithRetry(
      `${LOCUS_BASE}/wrapped/fal-ai/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          image_size: "square",
          num_images: 1,
        }),
      }
    );

    if (falRes.ok) {
      const data = await falRes.json();
      const falData = data?.data ?? data;
      const images = falData?.images ?? falData?.output ?? [];
      const firstImage = images[0];

      if (firstImage) {
        const imageUrl = firstImage.url ?? firstImage.image ?? null;

        console.log("[/api/intel/generate-image] fal.ai image generated successfully");

        return NextResponse.json({
          success: true,
          imageUrl,
          imageBase64: null,
          prompt,
          model: "fal.ai (Flux)",
        } satisfies GenerateImageResponse);
      }
    }

    // ── Final fallback: Return prompt with no image ──
    console.warn("[/api/intel/generate-image] Both image APIs unavailable");
    return NextResponse.json({
      success: true,
      imageUrl: null,
      imageBase64: null,
      prompt,
      model: "none (API unavailable)",
    } satisfies GenerateImageResponse);

  } catch (err) {
    console.error("[/api/intel/generate-image] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({
      success: false,
      imageUrl: null,
      imageBase64: null,
      prompt: "",
      model: "",
      error: message,
    } satisfies GenerateImageResponse);
  }
}
