"use client";

export type PipelineStage =
  | "idle"
  | "register"
  | "fund"
  | "intel"
  | "price"
  | "compliance"
  | "negotiate"
  | "settle"
  | "deliver"
  | "complete"
  | "failed";

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: "register", label: "Register" },
  { key: "fund", label: "Fund" },
  { key: "price", label: "Intel" },
  { key: "compliance", label: "Comply" },
  { key: "negotiate", label: "Negotiate" },
  { key: "settle", label: "Settle" },
  { key: "deliver", label: "Deliver" },
];

const ORDER: PipelineStage[] = STAGES.map((s) => s.key);

function getStatus(
  stageKey: PipelineStage,
  current: PipelineStage
): "pending" | "active" | "completed" | "failed" {
  if (current === "idle") return "pending";
  if (current === "complete") return "completed";
  if (current === "failed") {
    // Show all stages up to the current failed position as completed,
    // and the last active one as failed
    const ci = ORDER.indexOf(stageKey);
    // We don't know exactly where it failed, so show all as pending
    // The pipeline will stop filling at the last known stage
    return ci <= 0 ? "failed" : "pending";
  }
  const ci = ORDER.indexOf(current);
  const si = ORDER.indexOf(stageKey);
  if (si < ci) return "completed";
  if (si === ci) return "active";
  return "pending";
}

export default function PipelineBar({
  stage,
  failedAt,
}: {
  stage: PipelineStage;
  failedAt?: PipelineStage;
}) {
  const isFailed = stage === "failed";

  // If failed, use the failedAt stage to calculate fill
  const effectiveStage = isFailed && failedAt ? failedAt : stage;
  const currentIndex =
    effectiveStage === "idle"
      ? -1
      : effectiveStage === "complete"
      ? ORDER.length
      : ORDER.indexOf(effectiveStage);
  const fillPercent =
    effectiveStage === "idle"
      ? 0
      : effectiveStage === "complete"
      ? 100
      : Math.max(0, (currentIndex / (ORDER.length - 1)) * 100);

  return (
    <div className="pipeline-bar w-full py-2">
      <div className="pipeline-track">
        <div
          className={`pipeline-track-fill ${
            isFailed ? "pipeline-track-failed" : ""
          }`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      {STAGES.map((s) => {
        const si = ORDER.indexOf(s.key);
        const ci = currentIndex;

        let status: "pending" | "active" | "completed" | "failed" = "pending";
        if (isFailed) {
          if (si < ci) status = "completed";
          else if (si === ci) status = "failed";
          else status = "pending";
        } else {
          status = getStatus(s.key, stage);
        }

        return (
          <div key={s.key} className="pipeline-node">
            <div
              className={`pipeline-dot ${
                status === "completed"
                  ? "completed"
                  : status === "active"
                  ? "active"
                  : status === "failed"
                  ? "failed"
                  : ""
              }`}
            />
            <span
              className={`pipeline-label ${
                status === "completed"
                  ? "completed"
                  : status === "active"
                  ? "active"
                  : status === "failed"
                  ? "failed"
                  : ""
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
