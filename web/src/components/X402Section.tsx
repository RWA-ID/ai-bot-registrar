import { useMemo } from "react";
import { namehash, parseEther } from "viem";
import { mainnet } from "wagmi/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { X402Widget, type ParentOption } from "@x402identity/widget-react";

const REGISTRAR = "0xeb9e9ea385fe28b51a3f9a7d93fb893e0a1f9633";
const FORWARDER = "0x05af104ce913e7ef39799bfada871817d3761778";
const PLATFORM_TREASURY = "0x5f11a48230f7CdaB91A2361576239091E4b1165b";
const PLATFORM_FEE = parseEther("0.001");

export function X402Section() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: mainnet.id });
  const { data: walletClient } = useWalletClient({ chainId: mainnet.id });

  const parents = useMemo<ParentOption[]>(
    () => [
      { label: "402bot.eth", node: namehash("402bot.eth") },
      { label: "402api.eth", node: namehash("402api.eth") },
      { label: "402mcp.eth", node: namehash("402mcp.eth") },
    ],
    [],
  );

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">
            Also: x402 Identities
          </h2>
          <p className="text-[#444] text-xs leading-relaxed max-w-md">
            Need a paid-agent identity? Claim a permanent subname under{" "}
            <span className="font-mono text-[#888]">402bot.eth</span>,{" "}
            <span className="font-mono text-[#888]">402api.eth</span>, or{" "}
            <span className="font-mono text-[#888]">402mcp.eth</span> — designed for
            agents that accept x402 micropayments.
          </p>
        </div>
        <a
          href="https://x402id.eth.link"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#06b6d4] hover:underline shrink-0"
        >
          About x402id ↗
        </a>
      </div>

      <X402Widget
        registrar={REGISTRAR}
        forwarder={FORWARDER}
        parents={parents}
        platformTreasury={PLATFORM_TREASURY}
        platformFeeWei={PLATFORM_FEE}
        chain={mainnet}
        publicClient={publicClient as any}
        walletClient={walletClient as any}
        account={address}
        theme="dark"
        blockExplorerUrl="https://etherscan.io"
      />
    </div>
  );
}
