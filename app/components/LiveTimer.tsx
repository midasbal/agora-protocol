"use client";

import { useEffect, useState, useRef } from "react";

interface LiveTimerProps {
  /** Whether the timer is running */
  running: boolean;
  /** Number of Locus API calls made so far */
  apiCallCount: number;
  /** Total estimated cost per API call in dollars */
  costPerCall?: number;
}

export default function LiveTimer({
  running,
  apiCallCount,
  costPerCall = 0.002,
}: LiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - (startTimeRef.current ?? Date.now()));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Reset when not running and apiCallCount goes to 0
  useEffect(() => {
    if (!running && apiCallCount === 0) {
      startTimeRef.current = null;
      setElapsed(0);
    }
  }, [running, apiCallCount]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((elapsed % 1000) / 100);
  const estimatedCost = (apiCallCount * costPerCall).toFixed(4);

  return (
    <div className="flex items-center gap-4 rounded-md border border-neon-green/15 bg-panel-bg/80 px-3 py-1.5 text-[10px]">
      {/* Timer */}
      <div className="flex items-center gap-1.5">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
          running
            ? "bg-neon-green animate-pulse shadow-[0_0_6px_var(--neon-green)]"
            : elapsed > 0
              ? "bg-purple-400 shadow-[0_0_4px_#c084fc]"
              : "bg-neon-green/20"
        }`} />
        <span className="text-neon-green/40 uppercase tracking-wider">Time</span>
        <span className="text-neon-green tabular-nums font-bold min-w-[60px]">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}.{tenths}
        </span>
      </div>

      {/* Separator */}
      <span className="text-neon-green/10">│</span>

      {/* API Calls */}
      <div className="flex items-center gap-1.5">
        <span className="text-neon-green/40 uppercase tracking-wider">APIs</span>
        <span className="text-neon-blue tabular-nums font-bold">{apiCallCount}</span>
      </div>

      {/* Separator */}
      <span className="text-neon-green/10">│</span>

      {/* Estimated Cost */}
      <div className="flex items-center gap-1.5">
        <span className="text-neon-green/40 uppercase tracking-wider">Cost</span>
        <span className="text-neon-orange tabular-nums font-bold">${estimatedCost}</span>
      </div>
    </div>
  );
}
