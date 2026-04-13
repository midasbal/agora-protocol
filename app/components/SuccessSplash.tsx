"use client";

import { useEffect, useState } from "react";

interface SuccessSplashProps {
  show: boolean;
  assetName: string;
  finalPrice: number;
  protocolFee?: string;
  txHash?: string;
  onDismiss: () => void;
}

export default function SuccessSplash({
  show,
  assetName,
  finalPrice,
  protocolFee,
  txHash,
  onDismiss,
}: SuccessSplashProps) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setFadeOut(false);

      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss();
        }, 600);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`success-splash-overlay ${fadeOut ? "splash-fade-out" : "splash-fade-in"}`}
      onClick={() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss();
        }, 400);
      }}
    >
      {/* Screen Flash */}
      <div className="success-flash" />

      {/* Content */}
      <div className="success-splash-content">
        <div className="success-checkmark">✓</div>

        <h1 className="success-title">SETTLEMENT COMPLETE</h1>

        <div className="success-details">
          <div className="success-row">
            <span className="text-neon-green/50">ASSET</span>
            <span className="text-neon-green font-bold">{assetName}</span>
          </div>
          <div className="success-row">
            <span className="text-neon-green/50">AGREED PRICE</span>
            <span className="text-neon-green font-bold text-2xl">${finalPrice.toFixed(2)}</span>
          </div>
          {protocolFee && (
            <div className="success-row">
              <span className="text-neon-green/50">PROTOCOL FEE</span>
              <span className="text-neon-orange">${protocolFee} (5%)</span>
            </div>
          )}
          {txHash && (
            <div className="success-row">
              <span className="text-neon-green/50">TX HASH</span>
              <span className="text-neon-blue text-[10px] font-mono break-all">
                {txHash.startsWith("0x") ? (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {txHash}
                  </a>
                ) : (
                  txHash
                )}
              </span>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-neon-green/30 uppercase tracking-widest">
          Click anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
