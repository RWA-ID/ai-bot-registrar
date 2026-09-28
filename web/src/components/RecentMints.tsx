import { useEffect, useState } from "react";
import { decodeEventLog, parseAbi } from "viem";
import { REGISTRAR_ADDRESS, PARENT_DOMAIN } from "../lib/contract";
import { ArrowNE } from "./ArrowNE";

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
        setMints(sorted.slice(0, 6));
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
    <div className="flex flex-col gap-5 min-w-0">
      <div className="flex justify-between items-center gap-3">
        <h3 className="h3">Recent registrations</h3>
        {!loading && total > 0 && (
          <span className="font-mono text-xs text-[var(--lime)] border border-[rgba(200,245,60,.35)] px-2.5 py-[5px] whitespace-nowrap">
            {total} total
          </span>
        )}
      </div>

      <div className="flex flex-col border-t border-[var(--border)]">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-[69px] border-b border-[var(--border)] flex items-center px-1">
              <div className="h-4 w-1/2 bg-[var(--surface)] animate-pulse" />
            </div>
          ))
        ) : mints.length === 0 ? (
          <p className="py-4 px-1 text-sm text-[var(--muted)]">No registrations found yet.</p>
        ) : (
          mints.map((mint, i) => (
            <a
              key={mint.txHash || i}
              href={`https://etherscan.io/tx/${mint.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 py-4 px-1 border-b border-[var(--border)] text-[var(--text)] hover:text-[var(--text)] row-hover"
            >
              <span className="font-mono text-[11px] text-[var(--dim)] w-9 shrink-0">
                {String(total - i).padStart(4, "0")}
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span className="font-mono text-[15px] font-semibold truncate">
                  {mint.subdomain}
                  <span className="text-[var(--dim)]">.{PARENT_DOMAIN}</span>
                </span>
                <span className="text-xs text-[var(--muted)]">
                  by <span className="font-mono">{shortAddr(mint.owner)}</span>
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--muted)] shrink-0">
                {mint.timestamp > 0n ? timeAgo(mint.timestamp) : ""}
              </span>
              <span className="text-[var(--lime)] text-sm shrink-0">
                <ArrowNE />
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
