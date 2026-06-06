import { useEffect, useState } from "react";
import { decodeEventLog, parseAbi } from "viem";
import { REGISTRAR_ADDRESS, PARENT_DOMAIN } from "../lib/contract";

interface MintEvent {
  subdomain: string;
  owner: string;
  timestamp: bigint;
  txHash: string;
}

const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_KEY ?? "";

const EVENT_ABI = parseAbi([
  "event SubdomainRegistered(string subdomain, address indexed owner, bytes32 indexed label, bytes32 subnode, uint256 price, uint256 timestamp)",
]);

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(ts: bigint) {
  const diff = Math.floor(Date.now() / 1000) - Number(ts);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RecentMints({ refreshKey }: { refreshKey: number }) {
  const [mints, setMints] = useState<MintEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchLogs() {
      try {
        const res = await fetch(
          `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&address=${REGISTRAR_ADDRESS}&fromBlock=0&toBlock=latest&apikey=${ETHERSCAN_KEY}`
        );
        const data = await res.json();

        if (cancelled) return;
        if (data.status !== "1" || !Array.isArray(data.result)) {
          setLoading(false);
          return;
        }

        const logs: MintEvent[] = [];
        for (const log of data.result) {
          try {
            const decoded = decodeEventLog({
              abi: EVENT_ABI,
              data: log.data,
              topics: log.topics,
            });
            const args = decoded.args as { subdomain: string; owner: string; timestamp: bigint };
            logs.push({
              subdomain: args.subdomain,
              owner: args.owner,
              timestamp: args.timestamp,
              txHash: log.transactionHash,
            });
          } catch {
            // skip undecodeable logs
          }
        }

        const sorted = logs.slice().reverse();
        setTotal(sorted.length);
        setMints(sorted.slice(0, 10));
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLogs();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">Recent Registrations</h2>
        {!loading && (
          <span className="tag tag-cyan">{total} total</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-[#0f0f18] animate-pulse" />
          ))}
        </div>
      ) : mints.length === 0 ? (
        <p className="text-[#444] text-sm">No registrations found yet.</p>
      ) : (
        <div className="space-y-2">
          {mints.map((mint, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-[rgba(6,182,212,0.02)] border border-[#1a1a2e] hover:border-[rgba(6,182,212,0.15)] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm shrink-0">🤖</span>
                <div className="min-w-0">
                  <p className="text-[#f0f0f0] font-mono font-semibold truncate">
                    {mint.subdomain}
                    <span className="text-[#444]">.{PARENT_DOMAIN}</span>
                  </p>
                  <p className="text-[#444] text-xs">
                    by{" "}
                    <a
                      href={`https://etherscan.io/address/${mint.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#555] hover:text-[#06b6d4] transition-colors"
                    >
                      {shortAddr(mint.owner)}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[#444] text-xs hidden sm:block">
                  {mint.timestamp > 0n ? timeAgo(mint.timestamp) : ""}
                </span>
                {mint.txHash && (
                  <a
                    href={`https://etherscan.io/tx/${mint.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#333] group-hover:text-[#06b6d4] transition-colors"
                  >
                    ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
