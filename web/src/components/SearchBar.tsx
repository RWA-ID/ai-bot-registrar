import { useState, useEffect, useRef } from "react";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { ABI, REGISTRAR_ADDRESS, NAME_WRAPPER_ADDRESS, NAME_WRAPPER_ABI, REGISTRATION_FEE, PARENT_DOMAIN, getSubnodeHash } from "../lib/contract";

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

interface MintedInfo {
  name: string;
  txHash: string;
}

function sanitize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
}

function isValid(name: string) {
  return name.length >= 3 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name);
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function SearchBar({ onRegistered }: { onRegistered?: () => void }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [minted, setMinted] = useState<MintedInfo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const enabled = query.length >= 3 && isValid(query);

  const { data: contractData, isFetching, isError } = useReadContracts({
    contracts: [
      {
        address: REGISTRAR_ADDRESS,
        abi: ABI,
        functionName: "isSubdomainAvailable",
        args: [query],
      },
      {
        address: NAME_WRAPPER_ADDRESS,
        abi: NAME_WRAPPER_ABI,
        functionName: "ownerOf",
        args: [enabled ? getSubnodeHash(query) : 0n],
      },
    ],
    query: { enabled, retry: 2 },
  });

  const registrarSaysAvailable = contractData?.[0]?.status === "success"
    ? (contractData[0].result as boolean)
    : undefined;
  const wrapperOwner = contractData?.[1]?.status === "success"
    ? (contractData[1].result as `0x${string}`)
    : undefined;
  const wrapperSaysTaken =
    wrapperOwner !== undefined &&
    wrapperOwner !== "0x0000000000000000000000000000000000000000";

  const isAvailable =
    registrarSaysAvailable === undefined && wrapperOwner === undefined
      ? undefined
      : !wrapperSaysTaken && registrarSaysAvailable === true;

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();

  const { isLoading: isMining, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Capture name + hash BEFORE resetting state
  useEffect(() => {
    if (isConfirmed && txHash && query) {
      setMinted({ name: `${query}.${PARENT_DOMAIN}`, txHash });
      setInput("");
      setQuery("");
      setCheckState("idle");
      reset();
      // Delay refresh so the RPC has time to index the new event
      setTimeout(() => onRegistered?.(), 3000);
    }
  }, [isConfirmed]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const clean = sanitize(input);

    if (!clean) {
      setQuery("");
      setCheckState("idle");
      return;
    }

    if (!isValid(clean)) {
      setCheckState("invalid");
      setQuery("");
      return;
    }

    setCheckState("checking");
    debounceRef.current = setTimeout(() => {
      setQuery(clean);
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [input]);

  useEffect(() => {
    if (!query) return;
    if (isFetching) return;
    if (isError) {
      setCheckState("idle");
      return;
    }
    if (isAvailable === true) setCheckState("available");
    else if (isAvailable === false) setCheckState("taken");
  }, [isAvailable, isFetching, isError, query]);

  const handleRegister = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    writeContract({
      address: REGISTRAR_ADDRESS,
      abi: ABI,
      functionName: "registerSubdomain",
      args: [query],
      value: REGISTRATION_FEE,
    });
  };

  const handleRegisterAnother = () => {
    setMinted(null);
    setInput("");
    setCheckState("idle");
  };

  const fullName = query ? `${query}.${PARENT_DOMAIN}` : null;
  const isRegistering = isPending || isMining;

  // Success screen
  if (minted) {
    const shareText = `Just registered ${minted.name} — a permanent ENS identity for AI agents on @ai_bot_eth 🤖\n\nNo renewals. Fully onchain. Built on @ensdomains.\n\n`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://ai-bot.eth.link")}`;

    return (
      <div className="w-full max-w-2xl mx-auto">
        <div
          className="card p-8 animate-slide-up text-center space-y-6"
          style={{ borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.03)" }}
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)" }}
            >
              🤖
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <p className="text-[#10b981] font-bold uppercase tracking-widest text-xs">Registration Successful</p>
            <p className="text-[#f0f0f0] font-mono text-2xl font-bold break-all">{minted.name}</p>
            <p className="text-[#555] text-sm">Your AI agent now has a permanent ENS identity on Ethereum.</p>
          </div>

          {/* Tx hash */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: "#0a0a12", border: "1px solid #1a1a2e" }}
          >
            <div className="text-left">
              <p className="text-[#444] text-xs mb-1">Transaction</p>
              <p className="font-mono text-[#888] text-sm">{shortHash(minted.txHash)}</p>
            </div>
            <a
              href={`https://etherscan.io/tx/${minted.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#06b6d4] hover:underline shrink-0"
            >
              View on Etherscan ↗
            </a>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              style={{ background: "#000", border: "1px solid #333", color: "#fff" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
            <a
              href={`https://app.ens.domains/${minted.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}
            >
              Open in ENS Manager ↗
            </a>
          </div>

          <button
            onClick={handleRegisterAnother}
            className="text-xs text-[#444] hover:text-[#888] transition-colors"
          >
            Register another name →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="yourbot"
            maxLength={32}
            spellCheck={false}
            autoComplete="off"
            className="input-field flex-1 px-5 py-4 text-lg rounded-r-none border-r-0 focus:z-10"
          />
          <div className="px-4 py-4 bg-[#0a0a12] border border-[#1a1a2e] border-l-0 rounded-r-xl text-[#444] text-base whitespace-nowrap font-mono">
            .ai-bot.eth
          </div>
        </div>

        {checkState === "checking" && (
          <div className="absolute right-28 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {checkState === "invalid" && input.length > 0 && (
        <div className="card p-4 animate-fade-in">
          <p className="text-[#ef4444] text-sm">
            Names must be 3–32 characters, letters, numbers, and hyphens only. Cannot start or end with a hyphen.
          </p>
        </div>
      )}

      {checkState === "available" && fullName && (
        <div className="card p-5 border-[#10b981]/30 glow-green animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[#10b981] text-xs font-semibold uppercase tracking-wider">Available</span>
              </div>
              <p className="text-[#f0f0f0] text-lg font-bold break-all">{fullName}</p>
              <p className="text-[#555] text-sm">
                One-time fee · No renewals · You own it forever
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <p className="text-[#f0f0f0] font-bold text-xl">
                {formatEther(REGISTRATION_FEE)} ETH
              </p>
              <button
                className="btn-primary px-6 py-3 text-sm w-full sm:w-auto"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering
                  ? isMining
                    ? "⏳ Confirming..."
                    : "⏳ Waiting..."
                  : isConnected
                  ? "Register Name →"
                  : "Connect & Register →"}
              </button>
            </div>
          </div>

          {txHash && isMining && (
            <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2 text-xs text-[#555]">
              <div className="w-3 h-3 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
              <span>Transaction submitted — waiting for confirmation...</span>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06b6d4] hover:underline ml-auto"
              >
                View ↗
              </a>
            </div>
          )}
        </div>
      )}

      {checkState === "taken" && fullName && (
        <div className="card p-5 border-[#ef4444]/20 glow-red animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <div>
              <p className="text-[#ef4444] text-xs font-semibold uppercase tracking-wider mb-1">Already Registered</p>
              <p className="text-[#888] text-sm">
                <span className="text-[#f0f0f0] font-semibold">{fullName}</span> is taken. Try a different name.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
