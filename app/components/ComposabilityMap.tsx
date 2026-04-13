"use client";

import type { PipelineStage } from "./PipelineBar";

interface ApiNodeDef {
  id: string;
  label: string;
  /** The pipeline stage that activates this node */
  activatesAt: PipelineStage;
  icon: string;
}

const API_NODES: ApiNodeDef[] = [
  { id: "register", label: "Self-Register", activatesAt: "register", icon: "⬡" },
  { id: "fund", label: "Pay Send", activatesAt: "fund", icon: "$" },
  { id: "cg", label: "CoinGecko", activatesAt: "price", icon: "Ξ" },
  { id: "av", label: "Alpha Vantage", activatesAt: "price", icon: "α" },
  { id: "tavily", label: "Tavily Search", activatesAt: "price", icon: "⊕" },
  { id: "ofac", label: "OFAC Sanctions", activatesAt: "compliance", icon: "⛨" },
  { id: "exa", label: "Exa Search", activatesAt: "negotiate", icon: "⎔" },
  { id: "oai", label: "OpenAI", activatesAt: "negotiate", icon: "λ" },
  { id: "checkout", label: "Checkout (2-Key)", activatesAt: "settle", icon: "⌬" },
  { id: "mpp", label: "MPP Fee Split", activatesAt: "settle", icon: "%" },
  { id: "stability", label: "Stability AI", activatesAt: "deliver", icon: "◎" },
];

const STAGE_ORDER: PipelineStage[] = [
  "register",
  "fund",
  "price",
  "compliance",
  "negotiate",
  "settle",
  "deliver",
];

function getNodeStatus(
  activatesAt: PipelineStage,
  current: PipelineStage,
  failedAt?: PipelineStage
): "pending" | "active" | "completed" | "failed" {
  if (current === "idle") return "pending";
  if (current === "complete") return "completed";

  const ci = current === "failed" && failedAt
    ? STAGE_ORDER.indexOf(failedAt)
    : STAGE_ORDER.indexOf(current);
  const ai = STAGE_ORDER.indexOf(activatesAt);

  if (current === "failed") {
    if (ai < ci) return "completed";
    if (ai === ci) return "failed";
    return "pending";
  }

  if (ai < ci) return "completed";
  if (ai === ci) return "active";
  return "pending";
}

export default function ComposabilityMap({
  stage,
  failedAt,
}: {
  stage: PipelineStage;
  failedAt?: PipelineStage;
}) {
  return (
    <div className="composability-map rounded-md border border-neon-green/20 bg-panel-bg p-4 glow-border-green">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-neon-green/50">
        ▸ API Composability Map
      </h2>
      <div className="flex flex-col">
        {API_NODES.map((node, i) => {
          const status = getNodeStatus(node.activatesAt, stage, failedAt);
          return (
            <div key={node.id}>
              <div
                className={`api-node ${status}`}
              >
                <span className="api-node-dot" />
                <span
                  className={`text-xs ${
                    status === "active"
                      ? "text-neon-blue"
                      : status === "completed"
                        ? "text-neon-green/80"
                        : status === "failed"
                          ? "text-red-400"
                          : "text-neon-green/25"
                  }`}
                >
                  {node.icon}
                </span>
                <span
                  className={`flex-1 ${
                    status === "active"
                      ? "text-neon-blue"
                      : status === "completed"
                        ? "text-neon-green/70"
                        : status === "failed"
                          ? "text-red-400"
                          : "text-neon-green/25"
                  }`}
                >
                  {node.label}
                </span>
                {status === "completed" && (
                  <span className="text-[10px] text-neon-green/50">✓</span>
                )}
                {status === "active" && (
                  <span className="text-[10px] text-neon-blue animate-pulse">●</span>
                )}
                {status === "failed" && (
                  <span className="text-[10px] text-red-400">✗</span>
                )}
              </div>
              {i < API_NODES.length - 1 && (
                <div
                  className={`api-connector ${
                    status === "completed" || status === "active" ? "active" :
                    status === "failed" ? "failed" : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-neon-green/10 pt-2 text-center">
        <span className={`text-[10px] uppercase tracking-widest ${
          stage === "failed" ? "text-red-400/60" : "text-neon-green/20"
        }`}>
          {stage === "idle"
            ? "Awaiting Deployment"
            : stage === "complete"
              ? "13 APIs Composed ✓"
              : stage === "failed"
                ? "Pipeline Failed — Retry Available"
                : "Locus Paygentic Chain"}
        </span>
      </div>
    </div>
  );
}
