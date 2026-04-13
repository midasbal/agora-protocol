"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  orbitRadius: number;
  orbitDuration: number;
  orbitOffset: number;
  mode: "orbit" | "burst";
  burstX?: number;
  burstY?: number;
}

const COLORS = ["#00ff88", "#00d4ff", "#c084fc", "#fb923c"];

function createOrbitParticle(id: number, cx: number, cy: number): Particle {
  const orbitRadius = 30 + Math.random() * 50;
  const angle = Math.random() * Math.PI * 2;
  return {
    id,
    x: cx + Math.cos(angle) * orbitRadius,
    y: cy + Math.sin(angle) * orbitRadius,
    size: 2 + Math.random() * 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    orbitRadius,
    orbitDuration: 4 + Math.random() * 6,
    orbitOffset: angle,
    mode: "orbit",
  };
}

export default function ParticleHalo({
  burst,
  containerRef,
}: {
  burst: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const burstTriggered = useRef(false);

  // Initialize orbit particles
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const initial = Array.from({ length: 12 }, (_, i) =>
      createOrbitParticle(i, cx, cy)
    );
    setParticles(initial);
  }, [containerRef]);

  // Handle burst
  const triggerBurst = useCallback(() => {
    setParticles((prev) =>
      prev.map((p) => ({
        ...p,
        mode: "burst" as const,
        burstX: (Math.random() - 0.5) * 200,
        burstY: (Math.random() - 0.5) * 200,
      }))
    );

    // Reset after burst animation
    setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      setParticles(
        Array.from({ length: 12 }, (_, i) => createOrbitParticle(i, cx, cy))
      );
    }, 900);
  }, [containerRef]);

  useEffect(() => {
    if (burst && !burstTriggered.current) {
      burstTriggered.current = true;
      triggerBurst();
    }
    if (!burst) {
      burstTriggered.current = false;
    }
  }, [burst, triggerBurst]);

  return (
    <div className="particle-field">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.mode === "orbit" ? "particle-orbit" : "particle-burst"}`}
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            "--orbit-radius": `${p.orbitRadius}px`,
            "--orbit-duration": `${p.orbitDuration}s`,
            "--burst-x": `${p.burstX ?? 0}px`,
            "--burst-y": `${p.burstY ?? 0}px`,
            animationDelay:
              p.mode === "orbit" ? `${-p.orbitOffset * 1000}ms` : "0ms",
            animationDuration:
              p.mode === "orbit" ? `${p.orbitDuration}s` : "0.8s",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
