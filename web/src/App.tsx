import { useState } from "react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { MyNames } from "./components/MyNames";
import { RecentMints } from "./components/RecentMints";
import { InfoGrid } from "./components/InfoGrid";
import { X402Section } from "./components/X402Section";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRegistered = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <Header />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            <span className="tag tag-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
              Live on Ethereum
            </span>
            <span className="tag tag-purple">ERC-8004 Compatible</span>
            <span className="tag tag-green">No Renewals</span>
          </div>

          <h1 className="font-mono text-3xl sm:text-5xl font-bold leading-tight">
            Give Your AI Agent
            <br />
            <span className="gradient-text">an ENS Identity</span>
          </h1>

          <p className="text-[#555] text-base max-w-lg mx-auto leading-relaxed">
            Register a permanent subdomain under{" "}
            <span className="font-mono text-[#888]">ai-bot.eth</span>.{" "}
            Fully onchain, ERC-8004 compatible, discoverable by any agent.
          </p>

          <p className="text-[#333] text-sm">
            0.001 ETH · One-time · No renewals · Instant
          </p>
        </div>

        {/* Search */}
        <div className="animate-slide-up">
          <SearchBar onRegistered={handleRegistered} />
        </div>

        {/* Info grid */}
        <InfoGrid />

        {/* My Names */}
        <MyNames refreshKey={refreshKey} />

        {/* Recent mints */}
        <RecentMints refreshKey={refreshKey} />

        {/* How it works */}
        <div className="card p-6 animate-fade-in">
          <h2 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider mb-5">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Search",
                desc: "Type any name to instantly check availability on ai-bot.eth",
              },
              {
                step: "02",
                title: "Register",
                desc: "Connect your wallet, pay 0.001 ETH, and claim your subdomain onchain",
              },
              {
                step: "03",
                title: "Own It",
                desc: "Your agent has a permanent ENS identity. Set records, link profiles, get discovered",
              },
            ].map((item) => (
              <div key={item.step} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#06b6d4] text-xs font-bold">{item.step}</span>
                  <div className="h-px flex-1 bg-[#1a1a2e]" />
                </div>
                <p className="font-bold text-[#f0f0f0] text-sm">{item.title}</p>
                <p className="text-[#444] text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* x402 Identity Hub widget */}
        <X402Section />

        {/* Developer section */}
        <div className="card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">For Developers & AI Agents</h2>
              <p className="text-[#444] text-xs leading-relaxed max-w-sm">
                Register programmatically via the contract. AI agents can autonomously claim their ENS identity on Ethereum.
              </p>
            </div>
            <div className="shrink-0">
              <a
                href="https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89#writeContract"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#06b6d4] hover:underline"
              >
                Write Contract on Etherscan ↗
              </a>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#080810] border border-[#1a1a2e] p-4 overflow-x-auto">
            <pre className="text-xs text-[#888] leading-relaxed"><code>{`const registrar = new ethers.Contract(
  "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
  ABI, signer
);

// Check availability
const available = await registrar.isSubdomainAvailable("myagent");

// Register — 0.001 ETH
const tx = await registrar.registerSubdomain("myagent", {
  value: ethers.parseEther("0.001")
});
// → myagent.ai-bot.eth is yours 🤖`}</code></pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1a1a2e] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#333]">
          <div className="flex flex-wrap gap-4">
            <span>ai-bot.eth</span>
            <span className="text-[#1a1a2e]">·</span>
            <a
              href="https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#06b6d4] transition-colors"
            >
              Contract ↗
            </a>
            <span className="text-[#1a1a2e]">·</span>
            <a
              href="https://github.com/RWA-ID/ai-bot-registrar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#06b6d4] transition-colors"
            >
              GitHub ↗
            </a>
            <span className="text-[#1a1a2e]">·</span>
            <a
              href="https://twitter.com/ai_bot_eth"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#06b6d4] transition-colors"
            >
              @ai_bot_eth ↗
            </a>
            <span className="text-[#1a1a2e]">·</span>
            <a
              href="https://app.ens.domains/ai-bot.eth"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#06b6d4] transition-colors"
            >
              ENS Manager ↗
            </a>
          </div>
          <div>
            <span className="tag tag-purple">ERC-8004</span>
          </div>
        </div>
      </main>
    </div>
  );
}
