import { useMemo, useState } from "react";
import { namehash, parseEther } from "viem";
import { mainnet } from "wagmi/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { X402Widget, type ParentOption } from "@x402identity/widget-react";
import { isEmbeddedWallet } from "../lib/wagmi";
import { ArrowNE } from "./ArrowNE";

const REGISTRAR = "0xeb9e9ea385fe28b51a3f9a7d93fb893e0a1f9633";
const FORWARDER = "0x05af104ce913e7ef39799bfada871817d3761778";
const PLATFORM_TREASURY = "0x5f11a48230f7CdaB91A2361576239091E4b1165b";
const PLATFORM_FEE = parseEther("0.001");

const PARENTS: (ParentOption & { tag: string })[] = [
  { label: "402bot.eth", node: namehash("402bot.eth"), tag: "Agents" },
  { label: "402api.eth", node: namehash("402api.eth"), tag: "APIs" },
  { label: "402mcp.eth", node: namehash("402mcp.eth"), tag: "MCP servers" },
];

export function X402Section() {
  const { address, connector } = useAccount();
  const { open } = useAppKit();
  const publicClient = usePublicClient({ chainId: mainnet.id });
  const { data: walletClient } = useWalletClient({ chainId: mainnet.id });
  const [picked, setPicked] = useState(0);
  const parent = PARENTS[picked];

  // The widget writes with `chain: wallet.chain`; an embedded wallet needs null (see isEmbeddedWallet).
  const widgetWallet = useMemo(
    () =>
      walletClient && isEmbeddedWallet(connector?.id)
        ? ({ ...walletClient, chain: null } as unknown as typeof walletClient)
        : walletClient,
    [walletClient, connector?.id],
  );

  // Hand the widget an account only once its wallet client exists, so Register never
  // runs against a wallet that is still loading.
  const ready = Boolean(address && widgetWallet);

  // The widget keeps its own parent in state, so it gets exactly one and remounts on change.
  const widgetParents = useMemo(() => [{ label: parent.label, node: parent.node }], [parent]);

  return (
    <section id="x402" className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-10 pb-[72px] scroll-mt-20">
      <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] bg-[var(--surface)] border border-[var(--border)]">
        <div className="px-6 py-10 sm:px-10 sm:py-12 flex flex-col gap-[22px]">
          <span className="eyebrow text-[var(--lime)]">Also available</span>
          <div className="flex items-center gap-4">
            <img src="x402-hub-logo.png" alt="" width={56} height={56} className="block w-14 h-14 shrink-0" />
            <h2 className="h2">
              x402 <span className="text-[var(--lime)]">Identity Hub</span>
            </h2>
          </div>
          <p className="m-0 text-base leading-relaxed text-[var(--text-2)] max-w-[460px]">
            Need a paid-agent identity? Claim a permanent subname designed for agents that accept x402
            micropayments.
          </p>
          <a
            href="https://x402id.eth.link"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start font-mono text-[13px] inline-flex items-center gap-1"
          >
            Visit x402 Identity Hub <ArrowNE />
          </a>
        </div>

        <div
          className="bg-[var(--lime)] text-[var(--bg)] p-6 sm:p-10 flex flex-col gap-3 justify-center"
          style={{ clipPath: "polygon(0 0,100% 0,100% 100%,40px 100%,0 calc(100% - 40px))" }}
        >
          <span className="eyebrow font-semibold mb-1">Choose a parent</span>
          {PARENTS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPicked(i)}
              aria-pressed={i === picked}
              className={`flex justify-between items-center px-4 py-3.5 font-mono text-base font-semibold text-left cursor-pointer border transition-colors ${
                i === picked
                  ? "bg-[var(--bg)] text-[var(--lime)] border-[var(--bg)]"
                  : "bg-transparent text-[var(--bg)] border-[rgba(11,12,10,.35)] hover:border-[var(--bg)]"
              }`}
            >
              <span>{p.label}</span>
              <span className="text-xs font-medium">{p.tag}</span>
            </button>
          ))}

          <div className="x402-host mt-3">
            <X402Widget
              key={parent.label}
              registrar={REGISTRAR}
              forwarder={FORWARDER}
              parents={widgetParents}
              platformTreasury={PLATFORM_TREASURY}
              platformFeeWei={PLATFORM_FEE}
              chain={mainnet}
              publicClient={publicClient as any}
              walletClient={widgetWallet as any}
              account={ready ? address : undefined}
              onConnect={() => open()}
              theme="dark"
              blockExplorerUrl="https://etherscan.io"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
