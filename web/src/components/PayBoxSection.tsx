import type { ReactNode } from "react";
import { ArrowNE } from "./ArrowNE";
import { CopyText, MCP_URL } from "./AgentsSection";

const PAYBOX_URL = "https://paybox.sh";

const STORES = [
  { href: "https://apps.apple.com/us/app/paybox-by-moonpay/id6776329908", src: "paybox/appstore-badge.png", alt: "Download PayBox by MoonPay on the App Store" },
  { href: "https://play.google.com/store/apps/details?id=com.moonpay.paybox", src: "paybox/googleplay-badge.png", alt: "Get PayBox by MoonPay on Google Play" },
];

const PROMPT =
  "Use Bot Names and PayBox to register mybot.ai-bot.eth to my PayBox wallet, set it as my primary name, and publish a one-page website for it. Show me each transaction before you sign it.";

const STEPS: [string, ReactNode][] = [
  [
    "01 · you vault",
    <>
      Fund a PayBox vault from a card or another wallet: about <strong>0.0015 ETH on Ethereum</strong> for a name,
      plus <strong>0.25 USDC on Base</strong> for a website. Keys stay yours; access is revocable at any time.
    </>,
  ],
  [
    "02 · you ask",
    <>
      &ldquo;Register <span className="font-mono text-[var(--text)]">mybot.ai-bot.eth</span> for me.&rdquo; Your AI app
      calls Bot Names for each step and PayBox asks you to approve every signature.
    </>,
  ],
  [
    "03 · you own",
    <>
      The name lands in your PayBox wallet, already its Ethereum and Base address, with its website live at{" "}
      <span className="font-mono text-[var(--text)]">mybot.ai-bot.eth.limo</span>. Nobody can revoke it.
    </>,
  ],
];

// Recordings from the HoodFi PayBox demos: each shows adding a connector by URL in that app.
// The Bot Names connector is added the same way, with the URL below.
const DEMOS = [
  { id: "claude", label: "Claude", video: "paybox/claude-connect.mp4", poster: "paybox/claude-connect.jpg", step: "Settings → Connectors → Add custom connector, then paste the connector URL." },
  { id: "grok", label: "Grok", video: "paybox/grok-connect.mp4", poster: "paybox/grok-connect.jpg", step: "Settings → Connectors → paste the connector URL and authorise it." },
];

export function PayBoxSection() {
  return (
    <section id="paybox" className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-20 sm:pt-28 pb-10 flex flex-col gap-10 scroll-mt-20">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-4 min-w-0">
          <span className="eyebrow text-[var(--lime)] inline-flex items-center gap-2.5">
            <img src="paybox/paybox-icon.png" alt="" width={22} height={22} className="w-[22px] h-[22px]" />
            Use with PayBox
          </span>
          <h2 className="h2 text-[clamp(34px,4vw,52px)]">
            Your AI app can <span className="text-[var(--lime)]">name your bot</span>
          </h2>
        </div>
        <div className="flex flex-col gap-4 max-w-[480px]">
          <p className="m-0 text-[15px] leading-relaxed text-[var(--text-2)]">
            <a href={PAYBOX_URL} target="_blank" rel="noopener noreferrer">PayBox</a> by MoonPay is a non-custodial
            wallet for AI apps: vault once, then give Claude, ChatGPT or Grok scoped, revocable access. Add it next to the
            Bot Names connector, and registering a name, setting its addresses and publishing its website happen in one
            conversation.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {STORES.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="block">
                <img src={s.src} alt={s.alt} height={40} className="h-10 w-auto block" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-0.5 bg-[var(--hairline)]">
        {STEPS.map(([key, body]) => (
          <div key={key} className="bg-[var(--bg)] hover:bg-[var(--surface)] transition-colors px-7 pt-7 pb-8 flex flex-col gap-3">
            <span className="font-mono text-xs tracking-[.08em] uppercase text-[var(--lime)]">{key}</span>
            <span className="text-[15px] leading-relaxed text-[var(--text-2)] [&_strong]:text-[var(--text)] [&_strong]:font-semibold">{body}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="h3">Add both connectors</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-7 items-start">
          {DEMOS.map((d) => (
            <figure key={d.id} className="m-0 flex flex-col gap-3 min-w-0">
              <video
                src={d.video}
                poster={d.poster}
                controls
                muted
                playsInline
                preload="none"
                className="block w-full aspect-video bg-[var(--code-bg)] border border-[var(--border)]"
              />
              <figcaption className="text-sm leading-relaxed text-[var(--text-2)]">
                <span className="font-display font-bold uppercase text-[var(--text)]">{d.label}:</span> {d.step}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="m-0 text-sm leading-relaxed text-[var(--text-2)]">
          Do it once for PayBox (its URL is on{" "}
          <a href={PAYBOX_URL} target="_blank" rel="noopener noreferrer">paybox.sh</a>) and once for Bot Names, then switch
          both on in your chat.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-7 items-start">
        <div className="flex flex-col gap-2 min-w-0">
          <span className="font-mono text-[11px] tracking-[.1em] uppercase text-[var(--muted)]">Bot Names connector URL</span>
          <CopyText text={MCP_URL} />
          <span className="mt-3 font-mono text-[11px] tracking-[.1em] uppercase text-[var(--muted)]">Then ask</span>
          <CopyText text={PROMPT} label={`"${PROMPT}"`} prose />
        </div>
        <a
          href="https://firstbot.ai-bot.eth.limo"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex flex-col gap-2 px-6 py-6 border border-[var(--lime)] bg-[var(--surface)] text-[var(--text)] hover:text-[var(--text)] row-hover"
        >
          <span className="eyebrow text-[var(--lime)]">Done this way</span>
          <span className="font-mono text-[20px] font-semibold break-all">firstbot.ai-bot.eth</span>
          <span className="text-sm leading-relaxed text-[var(--text-2)]">
            Registered by Claude with a PayBox wallet, website published and paid for, all in one chat.
          </span>
          <span className="font-mono text-xs inline-flex items-center gap-1 text-[var(--lime)]">
            firstbot.ai-bot.eth.limo <ArrowNE />
          </span>
        </a>
      </div>
      <p className="m-0 font-mono text-xs text-[var(--muted)]">
        PayBox is a MoonPay product. Bot Names is independent and not affiliated with MoonPay, Anthropic or xAI. Any
        wallet that can sign a transaction works the same way.
      </p>
    </section>
  );
}
