"use client";

export interface LedgerEntry {
  id: string;
  timestamp: string;
  action: string;
  txHash?: string;
  amount?: string;
  status: "success" | "pending" | "failed";
}

interface AuditLedgerProps {
  entries: LedgerEntry[];
}

const BASESCAN_TX = "https://basescan.org/tx/";

function isValidTxHash(hash: string): boolean {
  return hash.startsWith("0x") && hash.length >= 10;
}

export default function AuditLedger({ entries }: AuditLedgerProps) {
  if (entries.length === 0) return null;

  return (
    <div className="audit-ledger rounded-md border border-neon-blue/20 bg-panel-bg/90 backdrop-blur-sm overflow-hidden glow-border-blue">
      <div className="flex items-center justify-between border-b border-neon-blue/15 px-4 py-2 bg-panel-bg/60">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neon-blue/60">
          ▸ Audit Ledger
        </h2>
        <span className="text-[10px] text-neon-blue/30 tabular-nums">
          {entries.length} transaction{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="terminal-scroll max-h-[200px] overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-neon-blue/10 text-left text-neon-blue/40 uppercase tracking-wider">
              <th className="px-4 py-1.5 font-medium">Time</th>
              <th className="px-2 py-1.5 font-medium">Action</th>
              <th className="px-2 py-1.5 font-medium text-right">Amount</th>
              <th className="px-2 py-1.5 font-medium">Tx Hash</th>
              <th className="px-4 py-1.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-neon-blue/5 transition-colors hover:bg-neon-blue/5"
              >
                <td className="px-4 py-1.5 text-neon-green/30 tabular-nums whitespace-nowrap">
                  {entry.timestamp}
                </td>
                <td className="px-2 py-1.5 text-neon-green/70 font-medium">
                  {entry.action}
                </td>
                <td className="px-2 py-1.5 text-right text-neon-orange tabular-nums font-bold">
                  {entry.amount ?? "—"}
                </td>
                <td className="px-2 py-1.5 font-mono">
                  {entry.txHash ? (
                    isValidTxHash(entry.txHash) ? (
                      <a
                        href={`${BASESCAN_TX}${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-blue/70 hover:text-neon-blue hover:underline transition-colors"
                        title={entry.txHash}
                      >
                        {entry.txHash.slice(0, 6)}...{entry.txHash.slice(-4)}
                      </a>
                    ) : (
                      <span className="text-neon-green/30" title={entry.txHash}>
                        {entry.txHash.slice(0, 16)}...
                      </span>
                    )
                  ) : (
                    <span className="text-neon-green/15">—</span>
                  )}
                </td>
                <td className="px-4 py-1.5 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      entry.status === "success"
                        ? "bg-neon-green/10 text-neon-green"
                        : entry.status === "pending"
                          ? "bg-neon-blue/10 text-neon-blue"
                          : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    <span
                      className={`inline-block h-1 w-1 rounded-full ${
                        entry.status === "success"
                          ? "bg-neon-green"
                          : entry.status === "pending"
                            ? "bg-neon-blue animate-pulse"
                            : "bg-red-400"
                      }`}
                    />
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
