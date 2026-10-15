import { useState, useEffect, useRef } from "react";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { mainnet } from "wagmi/chains";
import { useAppKit } from "@reown/appkit/react";
import { ArrowNE } from "./ArrowNE";
import { ABI, REGISTRAR_ADDRESS, REGISTRATION_FEE, PARENT_DOMAIN, isValidLabel, mintRecords } from "../lib/contract";
import { isEmbeddedWallet } from "../lib/wagmi";

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

interface MintedInfo {
  name: string;
  txHash: string;
}

function sanitize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 63);
}

const isValid = isValidLabel;

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function SearchBar({ onRegistered }: { onRegistered?: () => void }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [minted, setMinted] = useState<MintedInfo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { isConnected, address, connector } = useAccount();
  const { open: openConnectModal } = useAppKit();

  const enabled = query.length >= 3 && isValid(query);

  // available() checks the NameWrapper and the registry, so it also covers v1's names
  const { data: contractData, isFetching, isError } = useReadContracts({
    contracts: [
      { address: REGISTRAR_ADDRESS, abi: ABI, functionName: "available", args: [query] },
      { address: REGISTRAR_ADDRESS, abi: ABI, functionName: "fee" },
    ],
    query: { enabled, retry: 2 },
  });

  // A failed read is "unknown", never "taken"
  const isAvailable = contractData?.[0]?.status === "success" ? contractData[0].result : undefined;
  const fee = contractData?.[1]?.status === "success" ? contractData[1].result : REGISTRATION_FEE;

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();

  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: mainnet.id,
  });
  // A mined receipt can still be a revert; only "success" means the name exists
  const isConfirmed = receipt?.status === "success";
  const isReverted = receipt?.status === "reverted";

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
      openConnectModal();
      return;
    }
    if (!address) return;
    writeContract({
      address: REGISTRAR_ADDRESS,
      abi: ABI,
      functionName: "register",
      // The minting wallet becomes the name's Ethereum and Base address in the same tx
      args: [query, address, mintRecords(query, address)],
      value: fee,
      // wagmi turns chainId into viem's `chain` (no chainId = null). Other wallets get the
      // mainnet check; an embedded (email/social) wallet rejects a write that names a chain.
      ...(isEmbeddedWallet(connector?.id) ? {} : { chainId: mainnet.id }),
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
    const shareText = `My bot just got its name: ${minted.name}. One name for its wallets and website, via @botnameservice on @ensdomains.\n\n`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://botnames.dev")}`;

    return (
      <div className="border border-[var(--lime)] bg-[var(--surface)] p-[26px] flex flex-col gap-5 rise">
        <div className="flex flex-col gap-2">
          <span className="eyebrow text-[var(--lime)]">Registration successful</span>
          <span className="font-display font-bold text-[30px] break-all">{minted.name}</span>
          <span className="text-sm text-[var(--text-2)]">It&apos;s already your wallet&apos;s Ethereum and Base address. Add more chains, an avatar or a website in the ENS Manager or over MCP.</span>
        </div>

        <div className="flex justify-between items-center gap-3 px-4 py-3 bg-[var(--bg)] border border-[var(--border)] font-mono text-[13px]">
          <span className="text-[var(--muted)]">tx {shortHash(minted.txHash)}</span>
          <a
            href={`https://etherscan.io/tx/${minted.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center gap-1 shrink-0"
          >
            Etherscan <ArrowNE />
          </a>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lime flex-1 min-w-[160px] p-[13px]"
          >
            Share on X
          </a>
          <a
            href={`https://app.ens.domains/${minted.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline flex-1 min-w-[160px] p-[13px]"
          >
            ENS Manager <ArrowNE />
          </a>
        </div>

        <button
          onClick={handleRegisterAnother}
          className="self-start bg-transparent border-0 p-0 cursor-pointer font-mono text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          Register another name →
        </button>
      </div>
    );
  }

  const registerLabel = isRegistering
    ? isMining
      ? "Confirming…"
      : "Confirm in wallet…"
    : isConnected
    ? "Register name →"
    : "Connect & register →";

  return (
    <div className="flex flex-col gap-3.5">
      {/* Search input: 1px border = outer wrapper padding, both chamfered */}
      <div className="bg-[var(--border-strong)] p-px chamfer-16 focus-within:bg-[var(--lime)] transition-colors">
        <div className="flex items-stretch bg-[var(--surface)] chamfer-16">
          <div className="flex items-center pl-[22px] text-[var(--lime)] font-mono text-lg">&gt;</div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="yourbot"
            maxLength={63}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Name to register"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[var(--text)] font-mono text-lg sm:text-xl py-[22px] px-3"
          />
          {checkState === "checking" && (
            <div className="flex items-center px-2 text-[var(--lime)]">
              <div className="w-4 h-4 spinner" />
            </div>
          )}
          <div className="flex items-center px-4 sm:px-[22px] font-mono text-sm sm:text-base text-[var(--muted)] border-l border-[var(--border)] whitespace-nowrap">
            .ai-bot.eth
          </div>
        </div>
      </div>

      {checkState === "idle" && (
        <div className="flex flex-wrap gap-[18px] font-mono text-xs text-[var(--muted)]">
          <span>0.001 ETH</span>
          <span className="text-[#3a3e34]">/</span>
          <span>One-time</span>
          <span className="text-[#3a3e34]">/</span>
          <span>Instant</span>
          <span className="text-[#3a3e34]">/</span>
          <span>Can&apos;t be revoked</span>
        </div>
      )}

      {checkState === "invalid" && input.length > 0 && (
        <div className="px-[18px] py-3.5 border border-[rgba(255,107,87,.35)] bg-[rgba(255,107,87,.06)] text-[var(--danger-text)] text-sm leading-normal rise">
          Names must be 3–63 characters: letters, numbers and hyphens. No leading or trailing hyphen.
        </div>
      )}

      {checkState === "taken" && fullName && (
        <div className="flex items-center gap-3.5 px-5 py-[18px] border border-[rgba(255,107,87,.35)] bg-[rgba(255,107,87,.06)] rise">
          <span className="w-2 h-2 rounded-full bg-[var(--danger)] shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="eyebrow tracking-[.1em] text-[var(--danger-text)]">Already registered</span>
            <span className="text-[15px] text-[var(--text-2)]">
              <span className="text-[var(--text)] font-semibold font-mono">{fullName}</span> is taken. Try another name.
            </span>
          </div>
        </div>
      )}

      {checkState === "available" && fullName && (
        <div
          className="bg-[var(--lime)] text-[var(--bg)] px-6 py-[22px] flex flex-col gap-4 rise"
          style={{ clipPath: "polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-[18px]">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="flex items-center gap-2 eyebrow font-semibold tracking-[.1em]">
                <span className="w-[7px] h-[7px] rounded-full bg-[var(--bg)] pulse-fast" />
                Available
              </span>
              <span className="font-mono text-[22px] font-semibold break-all">{fullName}</span>
              <span className="text-[13px] font-medium">0.001 ETH · one-time · no renewal fees</span>
            </div>
            <button
              className="btn btn-dark text-sm px-[22px] py-[15px]"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering && <span className="w-[13px] h-[13px] spinner" />}
              {registerLabel}
            </button>
          </div>

          <p className="m-0 text-[12px] font-medium">
            Your wallet becomes this name&apos;s Ethereum and Base address.
          </p>

          {isReverted && txHash && (
            <div className="pt-3 border-t border-[rgba(11,12,10,.2)] flex items-center gap-2 text-xs font-semibold">
              <span>The transaction failed onchain. Nothing was registered.</span>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 font-mono text-[var(--bg)] hover:text-[var(--bg)] underline"
              >
                View <ArrowNE />
              </a>
            </div>
          )}

          {writeError && !txHash && (
            <div className="pt-3 border-t border-[rgba(11,12,10,.2)] text-xs font-semibold">
              {writeError.message.includes("rejected") ? "Request cancelled in wallet." : "The wallet could not send the transaction."}
            </div>
          )}

          {txHash && isMining && (
            <div className="pt-3 border-t border-[rgba(11,12,10,.2)] flex items-center gap-2 text-xs font-medium">
              <span>Transaction submitted, waiting for confirmation…</span>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 font-mono text-[var(--bg)] hover:text-[var(--bg)] underline"
              >
                View <ArrowNE />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
