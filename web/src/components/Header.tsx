import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { REGISTRAR_ADDRESS } from "../lib/contract";

const NAV = [
  { id: "features", label: "Features" },
  { id: "agents", label: "Agents" },
  { id: "paybox", label: "PayBox" },
  { id: "sites", label: "Websites" },
  { id: "recent", label: "Recent" },
  { id: "developers", label: "Developers" },
];

export function LogoMark() {
  return <img src="logo-mark.png" alt="" width={32} height={32} className="block w-8 h-8" />;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  return (
    <button
      type="button"
      onClick={() => open(isConnected ? { view: "Account" } : undefined)}
      className="btn btn-lime chamfer-10 px-[18px] py-[11px]"
    >
      {isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect wallet"}
    </button>
  );
}

// Highlights the section currently under the header.
function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

export function Header() {
  const active = useActiveSection();
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[rgba(11,12,10,.82)] backdrop-blur-[14px]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-7 py-4 flex items-center justify-between gap-5">
        <a href="#top" className="flex items-center gap-3 text-[var(--text)] hover:text-[var(--text)]">
          <LogoMark />
          <div className="flex items-baseline gap-1.5 font-display">
            <span className="font-bold text-[19px] tracking-[.02em] text-[var(--lime)]">BOT</span>
            <span className="font-bold text-[19px] tracking-[.02em] text-[var(--text)]">NAMES</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={`nav-link ${active === n.id ? "active" : ""}`}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={`https://etherscan.io/address/${REGISTRAR_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 font-mono text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--lime)] pulse" />
            Mainnet
          </a>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
