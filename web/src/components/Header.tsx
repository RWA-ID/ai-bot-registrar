import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a2e] bg-[rgba(5,5,8,0.85)] backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] flex items-center justify-center text-base">
            🤖
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-[#06b6d4]">ai-bot</span>
            <span className="font-mono text-sm text-[#2a2a3e]">.eth</span>
            <span className="font-mono text-xs text-[#444] hidden sm:inline">/ registrar</span>
          </div>
          <span className="tag tag-purple hidden sm:inline-flex">ERC-8004</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <a
            href="https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#444] hover:text-[#06b6d4] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            Mainnet
          </a>
          <ConnectButton
            showBalance={false}
            chainStatus="none"
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>
      </div>
    </header>
  );
}
