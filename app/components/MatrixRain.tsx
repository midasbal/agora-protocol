"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01$Ξ◆⬡▲◇⎔⏣⌬λΩΔ".split("");

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let columns: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const fontSize = 14;
      const colCount = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: colCount }, () =>
        Math.random() * canvas.height
      );
    };

    resize();
    window.addEventListener("resize", resize);

    const fontSize = 14;

    const draw = () => {
      ctx.fillStyle = "rgba(6, 10, 14, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns.length; i++) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * fontSize;
        const y = columns[i];

        // Gradient from bright to dim
        const brightness = Math.random();
        if (brightness > 0.95) {
          ctx.fillStyle = "#00ff88";
          ctx.shadowColor = "#00ff88";
          ctx.shadowBlur = 8;
        } else if (brightness > 0.8) {
          ctx.fillStyle = "#00d4ff";
          ctx.shadowColor = "#00d4ff";
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = `rgba(0, 255, 136, ${0.15 + brightness * 0.25})`;
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(glyph, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        }

        columns[i] += fontSize;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-rain-canvas" />;
}
