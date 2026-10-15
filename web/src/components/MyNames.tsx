import { useEffect, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { decodeEventLog, pad } from "viem";
import {
  ABI,
  V1_ABI,
  REGISTRAR_ADDRESS,
  V1_REGISTRAR_ADDRESS,
  NAME_WRAPPER_ADDRESS,
  NAME_WRAPPER_ABI,
  PARENT_DOMAIN,
  getSubnodeHash,
} from "../lib/contract";
import { ArrowNE } from "./ArrowNE";

const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_KEY ?? "";

/** Labels v2 registered to `owner` (NameRegistered: topic2 = owner). */
async function fetchV2Labels(owner: string): Promise<string[]> {
  const res = await fetch(
    `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&address=${REGISTRAR_ADDRESS}&fromBlock=0&toBlock=latest&topic2=${pad(owner as `0x${string}`)}&apikey=${ETHERSCAN_KEY}`
  );
  const data = await res.json();
  if (!Array.isArray(data.result)) return [];
  const labels: string[] = [];
  for (const log of data.result) {
    try {
      const { args } = decodeEventLog({ abi: ABI, eventName: "NameRegistered", data: log.data, topics: log.topics });
      labels.push(args.label);
    } catch {
      // not a NameRegistered log
    }
  }
  return labels;
}

export function MyNames({ refreshKey }: { refreshKey: number }) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [v2Labels, setV2Labels] = useState<string[] | null>(null);

  const { data: v1Labels, isLoading: v1Loading } = useReadContract({
    address: V1_REGISTRAR_ADDRESS,
    abi: V1_ABI,
    functionName: "getAgentSubdomains",
    args: [address!],
    query: { enabled: isConnected && !!address },
  });

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setV2Labels(null);
    // Give Etherscan a moment to index a mint that just confirmed
    const t = setTimeout(() => {
      fetchV2Labels(address)
        .then((l) => !cancelled && setV2Labels(l))
        .catch(() => !cancelled && setV2Labels([]));
    }, refreshKey ? 3000 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [address, refreshKey]);

  // Both lists record who registered, not who holds the name now: keep only names still owned
  const candidates = [...new Set([...(v2Labels ?? []), ...(v1Labels ?? [])])];
  const { data: owners, isLoading: ownersLoading } = useReadContracts({
    contracts: candidates.map((label) => ({
      address: NAME_WRAPPER_ADDRESS,
      abi: NAME_WRAPPER_ABI,
      functionName: "ownerOf" as const,
      args: [getSubnodeHash(label)] as const,
    })),
    query: { enabled: candidates.length > 0 },
  });
  const names = candidates.filter(
    (_, i) => owners?.[i]?.status === "success" && (owners[i].result as string).toLowerCase() === address?.toLowerCase()
  );
  const isLoading = v1Loading || v2Labels === null || (candidates.length > 0 && ownersLoading);

  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border)] p-7 flex flex-col gap-[18px]">
      <div className="absolute top-0 right-0 w-7 h-7 corner-tri" />
      <div className="flex justify-between items-center gap-3">
        <h3 className="h3">Your names</h3>
        {isConnected && (
          <span className="font-mono text-xs text-[var(--muted)] mr-7">{names.length} registered</span>
        )}
      </div>

      {!isConnected ? (
        <>
          <p className="m-0 text-[15px] leading-relaxed text-[var(--text-2)]">
            Connect a wallet to see the agent names you own.
          </p>
          <button type="button" onClick={() => open()} className="btn btn-outline-lime self-start px-[18px] py-3">
            Connect wallet
          </button>
        </>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
          <div className="w-3 h-3 spinner text-[var(--lime)]" />
          Loading your names…
        </div>
      ) : names.length === 0 ? (
        <p className="m-0 text-[15px] text-[var(--text-2)]">You haven&apos;t registered any names yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {names.map((name) => (
            <div
              key={name}
              className="flex justify-between items-center gap-3 px-4 py-3.5 bg-[var(--bg)] border border-[var(--border-strong)]"
            >
              <span className="font-mono text-[15px] font-semibold break-all">
                {name}
                <span className="text-[var(--dim)]">.{PARENT_DOMAIN}</span>
              </span>
              <a
                href={`https://app.ens.domains/${name}.${PARENT_DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs shrink-0 inline-flex items-center gap-1"
              >
                Manage <ArrowNE />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
