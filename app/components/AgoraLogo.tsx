"use client";

export default function AgoraLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Logo Mark */}
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 logo-glow"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hex frame */}
        <polygon
          points="20,2 36,11 36,29 20,38 4,29 4,11"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        {/* Inner hex */}
        <polygon
          points="20,6 32,13 32,27 20,34 8,27 8,13"
          stroke="#00ff88"
          strokeWidth="0.5"
          fill="none"
          opacity="0.2"
        />
        {/* A letterform */}
        <path
          d="M20 9 L12 31 L15 31 L17.5 24 L22.5 24 L25 31 L28 31 L20 9Z M18.5 21 L20 15 L21.5 21Z"
          fill="url(#logoGrad)"
        />
        {/* Center node */}
        <circle cx="20" cy="20" r="1.5" fill="#00ff88" opacity="0.8">
          <animate
            attributeName="r"
            values="1.2;2;1.2"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </defs>
      </svg>
      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold tracking-[0.25em] text-neon-green">
          AGORA
        </span>
        <span className="text-[8px] tracking-[0.35em] text-neon-green/40 uppercase">
          Protocol
        </span>
      </div>
    </div>
  );
}
