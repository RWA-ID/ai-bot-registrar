const FEATURES: { title: string; desc: string }[] = [
  {
    title: "An onchain identity",
    desc: "A real ENS name every wallet, app and agent can read. Set it as the primary name and wallets show mybot.ai-bot.eth instead of 0x…. ERC-8004 compatible.",
  },
  {
    title: "Get paid in 100+ coins",
    desc: "Bitcoin, Solana, Ethereum, Base and every EVM chain, plus Dogecoin, XRP, Litecoin and 100+ more. Anyone can pay mybot.ai-bot.eth instead of pasting an address.",
  },
  {
    title: "A website on IPFS",
    desc: "The bot publishes its own page for $0.25: a profile, docs, a status page. Live at mybot.ai-bot.eth.limo, no server to run.",
  },
  {
    title: "A public profile",
    desc: "Avatar, description, X and GitHub handles, a Nostr key: text records that wallets and apps show next to the name.",
  },
  {
    title: "Runs itself over MCP",
    desc: "Your agent registers, sets its own addresses and deploys its site through the MCP server, and can check another bot's name before paying it.",
  },
  {
    title: "Yours outright",
    desc: "The parent name can never take it back. It's a token in your wallet: transfer it or sell it. A one-time fee, no renewal fees.",
  },
];

// Every ticker here is a coin the ENS address encoder supports (@ensdomains/address-encoder)
const COINS = ["BTC", "SOL", "ETH", "BASE", "ARB", "OP", "POL", "BNB", "AVAX", "DOGE", "LTC", "XRP", "ADA", "DOT", "ATOM", "TRX", "SUI", "NEAR", "XLM", "ALGO", "HBAR", "FIL", "STX", "NOSTR"];

export function FeaturesSection() {
  return (
    <section id="features" className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-20 sm:pt-28 pb-10 flex flex-col gap-12 scroll-mt-20">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <h2 className="h2 text-[clamp(34px,4vw,52px)]">
          Give your bot <span className="text-[var(--lime)]">superpowers</span>
        </h2>
        <p className="m-0 max-w-[420px] text-[15px] leading-relaxed text-[var(--text-2)]">
          One name does the work of a wallet address on every chain, a profile and a domain. Set it once, use it everywhere.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-0.5 bg-[var(--hairline)]">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-[var(--bg)] hover:bg-[var(--surface)] transition-colors px-7 pt-7 pb-8 flex flex-col gap-3">
            <span className="w-2 h-2 bg-[var(--lime)]" />
            <span className="font-display font-bold text-[21px] uppercase leading-tight">{f.title}</span>
            <span className="text-[15px] leading-relaxed text-[var(--text-2)]">{f.desc}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Some of the supported coins">
        {COINS.map((c) => (
          <span key={c} className="font-mono text-xs text-[var(--text-2)] border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5">
            {c}
          </span>
        ))}
        <span className="font-mono text-xs text-[var(--lime)] border border-[rgba(200,245,60,.35)] px-2.5 py-1.5">+ 100 more</span>
      </div>
    </section>
  );
}
