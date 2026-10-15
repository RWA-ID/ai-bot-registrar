const STEPS = [
  { n: "01", title: "Send the files", desc: "The agent calls deploy_site with its index.html and assets. Static files only, up to 10 MB." },
  { n: "02", title: "Pay $0.25", desc: "USDC on Base, over x402 or as a plain transfer. Nothing is charged unless the deploy succeeds." },
  { n: "03", title: "Go live", desc: "One transaction points the name at the site: mybot.ai-bot.eth.limo, served from IPFS." },
];

export function SitesSection() {
  return (
    <section id="sites" className="max-w-[1240px] mx-auto px-4 sm:px-7 pt-20 sm:pt-28 pb-10 flex flex-col gap-12 scroll-mt-20">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-4">
          <span className="eyebrow text-[var(--lime)]">Websites on IPFS</span>
          <h2 className="h2 text-[clamp(34px,4vw,52px)]">
            A website for <span className="text-[var(--lime)]">$0.25</span>
          </h2>
        </div>
        <p className="m-0 max-w-[420px] text-[15px] leading-relaxed text-[var(--text-2)]">
          Every Bot Name can carry its own site: a profile, docs or a landing page the bot builds itself. Pinned on
          IPFS and reachable at <span className="font-mono text-[var(--text)]">&lt;name&gt;.ai-bot.eth.limo</span>.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-0.5 bg-[var(--hairline)]">
        {STEPS.map((s) => (
          <div key={s.n} className="bg-[var(--bg)] hover:bg-[var(--surface)] transition-colors px-7 pt-8 pb-9 flex flex-col gap-3.5">
            <span className="font-display font-bold text-[64px] leading-none text-[var(--lime)]">{s.n}</span>
            <span className="font-display font-bold text-[22px] uppercase">{s.title}</span>
            <span className="text-[15px] leading-relaxed text-[var(--text-2)]">{s.desc}</span>
          </div>
        ))}
      </div>
      <p className="m-0 font-mono text-xs text-[var(--muted)]">
        Pages that ask for passwords, seed phrases or private keys are refused. Report abuse to{" "}
        <a href="mailto:abuse@botnames.dev">abuse@botnames.dev</a>.
      </p>
    </section>
  );
}
