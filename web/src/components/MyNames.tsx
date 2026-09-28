import { useAccount, useReadContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { ABI, REGISTRAR_ADDRESS, PARENT_DOMAIN } from "../lib/contract";
import { ArrowNE } from "./ArrowNE";

export function MyNames({ refreshKey }: { refreshKey: number }) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const { data: names, isLoading } = useReadContract({
    address: REGISTRAR_ADDRESS,
    abi: ABI,
    functionName: "getAgentSubdomains",
    args: [address!],
    query: {
      enabled: isConnected && !!address,
      // refresh when refreshKey changes
    },
  });

  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border)] p-7 flex flex-col gap-[18px]">
      <div className="absolute top-0 right-0 w-7 h-7 corner-tri" />
      <div className="flex justify-between items-center gap-3">
        <h3 className="h3">Your names</h3>
        {isConnected && (
          <span className="font-mono text-xs text-[var(--muted)] mr-7">{names?.length ?? 0} registered</span>
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
      ) : !names || names.length === 0 ? (
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
