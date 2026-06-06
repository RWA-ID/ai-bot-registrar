import { useAccount, useReadContract } from "wagmi";
import { ABI, REGISTRAR_ADDRESS, PARENT_DOMAIN } from "../lib/contract";

export function MyNames({ refreshKey }: { refreshKey: number }) {
  const { address, isConnected } = useAccount();

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

  if (!isConnected) return null;

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">Your Names</h2>
        <span className="tag tag-cyan">{names?.length ?? 0} registered</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[#444] text-sm">
          <div className="w-3 h-3 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
          Loading your names...
        </div>
      ) : !names || names.length === 0 ? (
        <p className="text-[#444] text-sm">You haven&apos;t registered any names yet.</p>
      ) : (
        <div className="space-y-2">
          {names.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-[rgba(6,182,212,0.03)] border border-[#1a1a2e] hover:border-[rgba(6,182,212,0.2)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🤖</span>
                <span className="text-[#f0f0f0] font-mono font-semibold">
                  {name}
                  <span className="text-[#444]">.{PARENT_DOMAIN}</span>
                </span>
              </div>
              <a
                href={`https://app.ens.domains/${name}.${PARENT_DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#06b6d4] hover:underline"
              >
                Manage ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
