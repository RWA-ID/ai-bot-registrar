import { useState } from "react";
import { ArrowNE } from "./ArrowNE";

export const MCP_URL = "https://mcp.botnames.dev/mcp";

const CLIENTS: { id: string; label: string; file: string; code: string }[] = [
  {
    id: "claude",
    label: "Claude Code",
    file: "terminal",
    code: `claude mcp add --transport http botnames ${MCP_URL}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    file: ".cursor/mcp.json",
    code: `{
  "mcpServers": {
    "botnames": { "url": "${MCP_URL}" }
  }
}`,
  },
  {
    id: "any",
    label: "Any MCP client",
    file: "settings",
    code: `Name:       Bot Names
URL:        ${MCP_URL}
Transport:  Streamable HTTP
Auth:       none`,
  },
];

const TOOLS: { name: string; desc: string }[] = [
  { name: "check_name", desc: "Is mybot.ai-bot.eth free, and what does it cost." },
  { name: "register_name", desc: "Register it and write its wallet addresses, avatar and text in one transaction." },
  { name: "set_records", desc: "Add or change addresses on Bitcoin, Solana, Ethereum, any EVM chain and other coins." },
  { name: "set_primary_name", desc: "Make wallets and explorers show mybot.ai-bot.eth instead of 0x…, on Ethereum and Base." },
  { name: "deploy_site", desc: "Pin a static website to IPFS for $0.25 and point the name at it." },
  { name: "resolve", desc: "Read any ENS name's addresses and records, or an address's primary name." },
  { name: "list_names", desc: "The Bot Names a wallet holds." },
];

const WALLETS = [
  { label: "Coinbase AgentKit", href: "https://docs.cdp.coinbase.com/agent-kit/welcome" },
  { label: "MetaMask agent wallet", href: "https://github.com/MetaMask/agent-skills" },
];

/** `prose` wraps at word boundaries; the default breaks anywhere, for long addresses and URLs. */
export function CopyText({ text, label, prose }: { text: string; label?: string; prose?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className={`flex items-center justify-between gap-3 px-4 py-3.5 bg-[var(--surface)] border border-[var(--border-strong)] hover:border-[var(--lime)] text-[var(--text)] font-mono text-[13px] cursor-pointer text-left ${prose ? "break-words leading-relaxed" : "break-all"} transition-colors`}
    >
      <span>{label ?? text}</span>
      <span className="text-[var(--lime)] shrink-0 text-xs">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function AgentsSection() {
  const [tab, setTab] = useState(CLIENTS[0].id);
  const client = CLIENTS.find((c) => c.id === tab) ?? CLIENTS[0];

  return (
    <section
      id="agents"
      className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-20 sm:pt-28 pb-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-12 items-start scroll-mt-20"
    >
      <div className="flex flex-col gap-[22px] min-w-0">
        <span className="eyebrow text-[var(--lime)]">For AI agents · MCP</span>
        <h2 className="h2">
          Bots register <span className="text-[var(--lime)]">themselves</span>
        </h2>
        <p className="m-0 text-base leading-relaxed text-[var(--text-2)] max-w-[480px]">
          Connect the Bot Names MCP server and your agent can claim its own name, set the addresses it gets paid on and
          publish its website. Bot Names never holds keys: every action comes back as a transaction for the agent&apos;s
          own wallet to sign.
        </p>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[.1em] uppercase text-[var(--muted)]">MCP server</span>
          <CopyText text={MCP_URL} />
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[11px] tracking-[.1em] uppercase text-[var(--muted)]">Bring your own wallet</span>
          <p className="m-0 text-sm leading-relaxed text-[var(--text-2)]">
            Any wallet that can send a raw transaction works. It needs ETH on Ethereum for names and records, and USDC
            on Base for websites.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px]">
            {WALLETS.map((w) => (
              <a key={w.label} href={w.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                {w.label} <ArrowNE />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        <div className="bg-[var(--code-bg)] border border-[var(--border)] min-w-0">
          <div className="flex items-center gap-1 px-2 border-b border-[var(--border)] overflow-x-auto" role="tablist">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={tab === c.id}
                onClick={() => setTab(c.id)}
                className={`shrink-0 bg-transparent border-0 border-b-2 cursor-pointer px-3 py-3 font-mono text-xs ${
                  tab === c.id ? "border-[var(--lime)] text-[var(--text)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {c.label}
              </button>
            ))}
            <span className="ml-auto shrink-0 pr-2 font-mono text-[11px] text-[var(--dim)]">{client.file}</span>
          </div>
          <pre className="m-0 px-[22px] py-5 overflow-x-auto font-mono text-[13px] leading-[1.7] text-[#c9cdc1]">
            <code>{client.code}</code>
          </pre>
        </div>

        <div className="flex flex-col border-t border-[var(--border)]">
          {TOOLS.map((t) => (
            <div key={t.name} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-b border-[var(--border)]">
              <span className="font-mono text-[13px] text-[var(--lime)] sm:w-[150px] shrink-0">{t.name}</span>
              <span className="text-sm leading-relaxed text-[var(--text-2)]">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
