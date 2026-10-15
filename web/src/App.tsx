import { useState } from "react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { MyNames } from "./components/MyNames";
import { RecentMints } from "./components/RecentMints";
import { InfoGrid } from "./components/InfoGrid";
import { X402Section } from "./components/X402Section";
import { ArrowNE } from "./components/ArrowNE";
import { REGISTRAR_ADDRESS } from "./lib/contract";

const STEPS = [
  { step: "01", title: "Search", desc: "Type any name to instantly check availability on ai-bot.eth." },
  { step: "02", title: "Register", desc: "Connect your wallet, pay 0.001 ETH, and claim your subdomain onchain." },
  { step: "03", title: "Own it", desc: "A permanent ENS identity. Set records, link profiles, get discovered." },
];

const FOOTER_LINKS = [
  { label: "Contract", href: `https://etherscan.io/address/${REGISTRAR_ADDRESS}` },
  { label: "GitHub", href: "https://github.com/RWA-ID/ai-bot-registrar" },
  { label: "@botnameservice", href: "https://x.com/botnameservice" },
  { label: "ENS Manager", href: "https://app.ens.domains/ai-bot.eth" },
];

function Tag({ children, lime }: { children: React.ReactNode; lime?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[11px] tracking-[.08em] uppercase px-3 py-1.5 border ${
        lime ? "border-[rgba(200,245,60,.35)] text-[var(--lime)]" : "border-[var(--border-strong)] text-[#b9bdb1]"
      }`}
    >
      {children}
    </span>
  );
}

function CopyAddress() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(REGISTRAR_ADDRESS).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="flex items-center justify-between gap-3 px-4 py-3.5 bg-[var(--surface)] border border-[var(--border-strong)] hover:border-[var(--lime)] text-[var(--text)] font-mono text-[13px] cursor-pointer text-left break-all transition-colors"
    >
      <span>{REGISTRAR_ADDRESS}</span>
      <span className="text-[var(--lime)] shrink-0 text-xs">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

const K = ({ children }: { children: React.ReactNode }) => <span className="text-[#8b9083]">{children}</span>;
const F = ({ children }: { children: React.ReactNode }) => <span className="text-[#e3ff8a]">{children}</span>;
const S = ({ children }: { children: React.ReactNode }) => <span className="text-[#c8f53c]">{children}</span>;
const C = ({ children }: { children: React.ReactNode }) => <span className="text-[#5c6157]">{children}</span>;

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRegistered = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg)]">
      <div className="absolute inset-0 pointer-events-none grid-texture" />

      <Header />

      <main id="top" className="relative z-[1]">
        {/* Hero */}
        <section
          id="register"
          className="relative max-w-[1240px] mx-auto px-4 sm:px-7 pt-14 pb-16 sm:pt-[88px] sm:pb-24 grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-16 items-center scroll-mt-20"
        >
          <div className="hidden sm:block absolute top-14 left-[46%] text-[var(--lime)] text-[26px] font-light leading-none" aria-hidden="true">+</div>
          <div className="hidden sm:block absolute bottom-[60px] left-6 text-[var(--lime)] text-xl font-light leading-none opacity-70" aria-hidden="true">+</div>

          <div className="flex flex-col gap-7 min-w-0">
            <div className="flex flex-wrap gap-2">
              <Tag lime>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--lime)] pulse" />
                Live on Ethereum
              </Tag>
              <Tag>ERC-8004 Compatible</Tag>
              <Tag>No Renewals</Tag>
            </div>

            <h1
              className="m-0 font-display font-bold uppercase text-[clamp(44px,6.2vw,82px)] leading-[.98] tracking-[-.01em]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Give your AI bot <span className="text-[var(--lime)]">an ENS identity</span>
            </h1>

            <p className="m-0 text-lg leading-relaxed text-[var(--text-2)] max-w-[520px]">
              Register a permanent subdomain under{" "}
              <span className="font-mono text-[var(--text)]">ai-bot.eth</span>. Fully onchain, ERC-8004 compatible,
              discoverable by any agent.
            </p>

            <div className="max-w-[600px]">
              <SearchBar onRegistered={handleRegistered} />
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative justify-self-center w-full max-w-[500px] aspect-[4/5]">
            <div className="absolute -top-3.5 -right-3.5 w-16 h-16 corner-tri" />
            <div className="absolute -bottom-3.5 -left-3.5 w-[120px] h-[120px] border-l-2 border-b-2 border-[var(--lime)]" />
            <div className="absolute inset-0 bg-[var(--lime)] p-px chamfer-40">
              <div className="relative w-full h-full overflow-hidden bg-[var(--bg)] chamfer-40">
                <img
                  src="hero-bg.jpg"
                  alt=""
                  className="block w-full h-full object-cover"
                  style={{ filter: "grayscale(1) contrast(1.15) brightness(.85)" }}
                />
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{ background: "linear-gradient(180deg,transparent 45%,rgba(200,245,60,.85) 100%)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg,transparent 60%,rgba(11,12,10,.7) 100%)" }}
                />
                <div className="absolute left-7 right-7 bottom-7 flex justify-between items-end gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="eyebrow text-[var(--lime)]">First agent</span>
                    <span className="font-mono text-[17px] font-semibold text-[var(--text)] break-all">firstagent.ai-bot.eth</span>
                  </div>
                  <span className="font-display font-bold text-[13px] text-[var(--bg)] bg-[var(--lime)] px-[9px] py-[5px]">#0001</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <InfoGrid />

        {/* How it works */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-20 sm:pt-28 pb-10 flex flex-col gap-12">
          <div className="flex flex-wrap justify-between items-end gap-6">
            <h2 className="h2 text-[clamp(34px,4vw,52px)]">
              How it <span className="text-[var(--lime)]">works</span>
            </h2>
            <p className="m-0 max-w-[380px] text-[15px] leading-relaxed text-[var(--text-2)]">
              Three steps, one transaction. No subscriptions, no expiry reminders.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-0.5 bg-[var(--hairline)]">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-[var(--bg)] hover:bg-[var(--surface)] transition-colors px-7 pt-8 pb-9 flex flex-col gap-3.5"
              >
                <span className="font-display font-bold text-[64px] leading-none text-[var(--lime)]">{item.step}</span>
                <span className="font-display font-bold text-[22px] uppercase">{item.title}</span>
                <span className="text-[15px] leading-relaxed text-[var(--text-2)]">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent + your names */}
        <section
          id="recent"
          className="max-w-[1240px] mx-auto px-4 sm:px-7 py-[72px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-7 items-start scroll-mt-20"
        >
          <RecentMints refreshKey={refreshKey} />

          <div className="flex flex-col gap-7 min-w-0">
            <MyNames refreshKey={refreshKey} />

            <div className="relative aspect-[16/10] overflow-hidden border border-[var(--border)]">
              <img
                src="logo.jpg"
                alt=""
                className="block w-full h-full object-cover"
                style={{ filter: "grayscale(1) brightness(.9)" }}
              />
              <div className="absolute inset-0 bg-[var(--lime)] mix-blend-multiply opacity-90" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg,rgba(11,12,10,.85),transparent 70%)" }}
              />
              <div className="absolute left-7 top-0 bottom-0 flex flex-col justify-center gap-2 max-w-[60%]">
                <span className="font-display font-bold text-[22px] sm:text-[28px] leading-[1.05] uppercase">
                  Discoverable by any agent
                </span>
                <span className="text-[13px] leading-normal text-[#d6d9cf]">
                  Every registration emits an onchain event other agents can index.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* x402 */}
        <X402Section />

        {/* Developers */}
        <section
          id="developers"
          className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-10 pb-20 sm:pb-28 grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-12 items-start scroll-mt-20"
        >
          <div className="flex flex-col gap-[22px] min-w-0">
            <span className="eyebrow text-[var(--lime)]">For developers &amp; AI agents</span>
            <h2 className="h2">
              Register <span className="text-[var(--lime)]">programmatically</span>
            </h2>
            <p className="m-0 text-base leading-relaxed text-[var(--text-2)] max-w-[440px]">
              Agents can autonomously claim their ENS identity by calling the contract directly.
            </p>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] tracking-[.1em] uppercase text-[var(--muted)]">Registrar contract</span>
              <CopyAddress />
            </div>
            <a
              href={`https://etherscan.io/address/${REGISTRAR_ADDRESS}#writeContract`}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start font-mono text-[13px] inline-flex items-center gap-1"
            >
              Write contract on Etherscan <ArrowNE />
            </a>
          </div>

          <div className="bg-[var(--code-bg)] border border-[var(--border)] min-w-0">
            <div className="flex items-center justify-between px-[18px] py-3 border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <span className="w-[9px] h-[9px] rounded-full bg-[var(--lime)]" />
                <span className="w-[9px] h-[9px] rounded-full bg-[var(--border-strong)]" />
                <span className="w-[9px] h-[9px] rounded-full bg-[var(--border-strong)]" />
              </div>
              <span className="font-mono text-[11px] text-[var(--muted)]">register.js</span>
            </div>
            <pre className="m-0 px-[22px] py-6 overflow-x-auto font-mono text-[13.5px] leading-[1.75] text-[#c9cdc1]">
              <code>
                <K>const</K> registrar = <K>new</K> ethers.<F>Contract</F>(
                {"\n  "}<S>"{REGISTRAR_ADDRESS}"</S>,
                {"\n  "}ABI, signer
                {"\n"});
                {"\n\n"}<C>// Check availability</C>
                {"\n"}<K>const</K> available = <K>await</K> registrar.<F>available</F>(<S>"myagent"</S>);
                {"\n\n"}<C>// Register + records in one tx, 0.001 ETH</C>
                {"\n"}<C>// records: resolver calls, e.g. setAddr / setText</C>
                {"\n"}<K>const</K> tx = <K>await</K> registrar.<F>register</F>(<S>"myagent"</S>, owner, records, {"{"}
                {"\n  "}value: <K>await</K> registrar.<F>fee</F>()
                {"\n"}{"}"});
                {"\n"}<C>// → myagent.ai-bot.eth is yours</C>
              </code>
            </pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-[1] border-t border-[var(--hairline)]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-10 pb-12 flex flex-wrap justify-between items-end gap-7">
          <div className="flex flex-col gap-1.5">
            <span className="font-display font-bold text-[clamp(40px,7vw,96px)] leading-[.9] text-[#1a1d17] tracking-[-.01em]">
              AI-BOT.ETH
            </span>
            <span className="font-mono text-xs text-[var(--muted)]">
              ENS subdomains for AI agents · Unaudited, use at your own risk
            </span>
          </div>
          <div className="flex flex-wrap gap-[22px] font-mono text-xs">
            {FOOTER_LINKS.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="link-muted inline-flex items-center gap-1">
                {l.label} <ArrowNE />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
