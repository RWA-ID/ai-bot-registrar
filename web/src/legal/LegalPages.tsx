import type { ReactNode } from "react";
import { ABUSE_EMAIL, BRAND, LEGAL_UPDATED, OPERATOR, operatorLine, SITE_URL, X_URL } from "../lib/legal";

const REGISTRAR = "0x52bf7D9A2F50ED9707c573FEAC708716E49B4275";
const SAFE = "0x5707Ad7526cF369bEa7af8732A7Af91d3e231C4e";
const MCP = "https://mcp.botnames.dev/mcp";

export type LegalPageId = "terms" | "privacy" | "disclaimer";

const PAGES: Record<LegalPageId, { title: string; body: () => ReactNode }> = {
  terms: { title: "Terms of Service", body: Terms },
  privacy: { title: "Privacy Policy", body: Privacy },
  disclaimer: { title: "Disclaimer", body: Disclaimer },
};

function Address() {
  return (
    <p>
      {OPERATOR.LEGAL_NAME}
      {OPERATOR.ADDRESS.map((l) => (
        <span key={l}>
          <br />
          {l}
        </span>
      ))}
    </p>
  );
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function LegalPage({ page }: { page: LegalPageId }) {
  const { title, body: Body } = PAGES[page];
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--hairline)]">
        <div className="max-w-[860px] mx-auto px-4 sm:px-7 py-4 flex items-center justify-between gap-4">
          <a href="../" className="flex items-center gap-3 text-[var(--text)] hover:text-[var(--text)]">
            <img src="../logo-mark.png" alt="" width={32} height={32} className="block w-8 h-8" />
            <span className="font-display font-bold text-[19px] tracking-[.02em]">
              <span className="text-[var(--lime)]">BOT</span> NAMES
            </span>
          </a>
          <a href="../" className="font-mono text-xs link-muted">
            ← Back to {BRAND}
          </a>
        </div>
      </header>
      <main className="max-w-[860px] mx-auto px-4 sm:px-7 pt-12 pb-20">
        <span className="eyebrow text-[var(--lime)]">Legal</span>
        <h1 className="mt-3 mb-2 font-display font-bold uppercase text-[clamp(34px,5vw,52px)] leading-none">{title}</h1>
        <p className="m-0 font-mono text-xs text-[var(--muted)]">Last updated {LEGAL_UPDATED}</p>
        <div className="legal mt-10">
          <Body />
        </div>
      </main>
      <footer className="border-t border-[var(--hairline)]">
        <div className="max-w-[860px] mx-auto px-4 sm:px-7 py-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
          <a href="../terms/" className="link-muted">Terms</a>
          <a href="../privacy/" className="link-muted">Privacy</a>
          <a href="../disclaimer/" className="link-muted">Disclaimer</a>
          <span className="text-[var(--muted)]">
            {BRAND} is operated by {OPERATOR.LEGAL_NAME}
          </span>
        </div>
      </footer>
    </div>
  );
}

function Terms() {
  return (
    <>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of {BRAND}: the website at {SITE_URL} and its IPFS
        copy at ai-bot.eth.limo (the &quot;Site&quot;), the MCP server at {MCP} (the &quot;MCP Server&quot;), and the
        website-hosting service offered through them (together, the &quot;Service&quot;). The Service is operated by{" "}
        {operatorLine()} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By using the Service, directly or through
        an AI agent or other software acting for you, you (&quot;you&quot;) agree to these Terms.
      </p>

      <h2>1. What the Service is</h2>
      <p>
        {BRAND} lets people and AI agents register names under ai-bot.eth on the Ethereum Name Service
        (&quot;ENS&quot;), for example mybot.ai-bot.eth (a &quot;Name&quot;), set records on them (wallet addresses,
        text, avatar, website), set a Name as a wallet&apos;s primary name, and publish static websites to IPFS. Names
        are created by the {BRAND} registrar smart contract on Ethereum mainnet ({REGISTRAR}).
      </p>
      <p>
        We are an independent operator. We are not affiliated with or endorsed by ENS Labs, the ENS DAO, xAI, Coinbase,
        MetaMask, Pinata, eth.limo or any other third party named on the Site, and we are not a bank, broker, exchange,
        custodian or money transmitter.
      </p>

      <h2>2. We never take custody</h2>
      <p>
        We never hold your private keys, your Names or your funds. The Site and the MCP Server only prepare
        transactions; you, or a wallet you or your agent control, review and sign them, and they execute directly on
        public blockchains. We cannot reverse, cancel or modify a transaction once it is sent, move a Name for you, or
        recover a Name or funds if you lose access to your wallet.
      </p>

      <h2>3. Registering a Name</h2>
      <ul>
        <li>
          <strong>Fee.</strong> A Name costs the registration fee the registrar contract charges at the time (currently
          0.001 ETH), plus network gas. The fee is set on-chain and may change for future registrations; it does not
          change for Names already registered. Fees and gas are non-refundable.
        </li>
        <li>
          <strong>Ownership.</strong> A Name is minted to the owner address in the transaction as a token in the ENS
          NameWrapper, with the PARENT_CANNOT_CONTROL fuse burned. Neither we nor the owner of ai-bot.eth can take it
          back or change its records. You can transfer it like any other token. (The few Names created by the first
          registrar contract, before October 2026, were minted without that fuse; their owners can ask us to burn it.)
        </li>
        <li>
          <strong>Expiry.</strong> Under ENS rules a Name cannot outlive its parent: it expires no later than ai-bot.eth
          does. There is no renewal fee for Name holders. We intend to keep ai-bot.eth renewed, but we do not guarantee
          it, and if ai-bot.eth expired, its Names would stop being valid. Each Name&apos;s current expiry is public on
          chain.
        </li>
        <li>
          <strong>First come, first served.</strong> Names are available to whoever registers them first. We do not
          verify identity or check registrations against trademarks, and a Name confers no rights in any trademark.
        </li>
      </ul>

      <h2>4. Records and primary names</h2>
      <p>
        You decide what records your Name holds. Wallet addresses you set are where other people and agents will send
        funds: an incorrect address can mean funds lost permanently, and we cannot recover them. Check every address
        before you sign. A primary name only displays when the Name also resolves to the same address.
      </p>

      <h2>5. Website hosting</h2>
      <ul>
        <li>
          <strong>Price.</strong> Each deploy costs US$0.25, paid in USDC on Base to {BRAND}&apos;s wallet ({SAFE}) via
          x402 or a direct transfer. You are charged only when the deploy succeeds. Payments are non-refundable,
          including for content we remove under these Terms.
        </li>
        <li>
          <strong>Your content.</strong> You keep all rights in content you deploy, and you grant us a worldwide,
          royalty-free licence to store, copy and serve it as needed to provide the Service. You confirm you have the
          right to publish it.
        </li>
        <li>
          <strong>Acceptable use.</strong> You may not deploy content that is unlawful; phishing, impersonation or
          pages that request passwords, seed phrases or private keys; malware; content that infringes others&apos;
          intellectual property or privacy; sexual content involving minors; content promoting violence or
          harassment; or content designed to defraud. We may refuse, unpin or block any content at our discretion,
          with or without notice.
        </li>
        <li>
          <strong>IPFS is public and persistent.</strong> Deployed sites are public. Content on IPFS is addressed by its
          hash and may remain available from other nodes or caches after we stop pinning it, and anyone can reference
          it. Do not deploy anything you are not prepared to make public permanently.
        </li>
        <li>
          <strong>Availability.</strong> We pin sites on a best-effort basis while the Service operates. Sites are
          reached through third-party gateways such as eth.limo, which we do not control.
        </li>
      </ul>

      <h2>6. AI agents and the MCP Server</h2>
      <p>
        If you let an AI agent or other software use the Service, everything it does is done on your behalf and you
        are responsible for it, including every transaction signed by a wallet you or it control and every site it
        deploys. AI systems make mistakes: review transactions before they are signed, and set spending limits on any
        wallet an agent controls. Output from the MCP Server is information, not advice. We may rate-limit, change or
        withdraw MCP tools at any time.
      </p>

      <h2>7. Your responsibilities</h2>
      <ul>
        <li>You are responsible for your wallets, keys, agents and the security of the devices you use.</li>
        <li>You are responsible for any taxes that apply to your activity.</li>
        <li>
          You may not use the Service if you are subject to sanctions administered by the U.S. (OFAC), the UN, the EU
          or the UK, or are located in a country or region subject to comprehensive sanctions, or to break any law.
        </li>
        <li>You may not interfere with or overload the Service, or try to access it other than through its public interfaces.</li>
      </ul>

      <h2>8. Third-party services</h2>
      <p>
        The Service depends on systems we do not control, including Ethereum, Base, ENS, IPFS, Pinata, eth.limo and other
        gateways, Cloudflare, Alchemy, Etherscan, Coinbase (the x402 facilitator), Reown/WalletConnect, wallets and AI
        clients. Your use of them is governed by their own terms, and we are not responsible for them.
      </p>

      <h2>9. No warranty</h2>
      <p>
        The Service and the smart contracts are provided &quot;as is&quot; and &quot;as available&quot;, without
        warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, title
        and non-infringement. The contracts have not been independently audited. See the{" "}
        <a href="../disclaimer/">Disclaimer</a>.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential or
        punitive damages, or for lost profits, data, funds or opportunities, or for losses arising from smart-contract
        behaviour, network conditions, gas prices, wallet compromise, lost keys, incorrect records, actions of AI
        agents, expired names, removed content or third-party services. Our total liability arising out of or relating
        to the Service will not exceed the greater of the fees you paid us in the twelve months before the claim or one
        hundred U.S. dollars (US$100).
      </p>

      <h2>11. Indemnity</h2>
      <p>
        You will indemnify and hold us harmless from claims, losses and costs (including reasonable legal fees)
        arising from your use of the Service, your content, your agents&apos; actions or your breach of these Terms.
      </p>

      <h2>12. Suspension and termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or end access to the Site, the MCP Server or hosting
        if we reasonably believe they are being used unlawfully or abusively. Names already registered stay in their
        owners&apos; wallets regardless: they are on chain, not held by us.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-laws
        rules. The parties will first try in good faith to resolve any dispute informally within thirty (30) days of
        written notice; failing that, disputes will be resolved exclusively by the state and federal courts located in
        the State of Delaware, and both parties consent to the personal jurisdiction of those courts.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may update these Terms. The version in force when you use the Service applies, and material changes will be
        reflected in the &quot;Last updated&quot; date above.
      </p>

      <h2>15. Contact</h2>
      <p>
        Abuse reports and takedown requests: email <a href={`mailto:${ABUSE_EMAIL}`}>{ABUSE_EMAIL}</a> with the Name or
        IPFS link and what is wrong with it. Other questions: message <A href={X_URL}>@botnameservice</A> on X. Legal
        notices:
      </p>
      <Address />
    </>
  );
}

function Privacy() {
  return (
    <>
      <p>
        This policy explains what information {BRAND} handles when you use the Site ({SITE_URL} and ai-bot.eth.limo), the
        MCP Server ({MCP}) and website hosting. {BRAND} is operated by {operatorLine()} (&quot;we&quot;, &quot;us&quot;).
        We do not have user accounts and we do not ask for your name or email address.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Analytics on the Site.</strong> The Site uses Google Analytics (Google LLC) to understand how it is
          used: pages viewed, approximate location, device and browser information, and referring pages. Google sets
          cookies and receives your IP address to do this. You can block it with your browser&apos;s tracking protection,
          a content blocker, or Google&apos;s{" "}
          <A href="https://tools.google.com/dlpage/gaoptout">opt-out add-on</A>.
        </li>
        <li>
          <strong>Wallet connection.</strong> When you connect a wallet, the Site sees your public address. Reown
          (WalletConnect) keeps the session in your browser&apos;s local storage; if you use an email or social login,
          Reown processes that login under its own policy.
        </li>
        <li>
          <strong>MCP requests.</strong> The MCP Server processes what an agent sends it: names, addresses, records and
          website files. It does not keep tool inputs after answering, apart from the records below.
        </li>
        <li>
          <strong>Hosting records.</strong> For each website deploy we keep the Name, the IPFS content identifier, the
          time, the size, and the payment transaction hash (to stop a payment being used twice). For takedowns we keep
          the content identifier and the reason.
        </li>
        <li>
          <strong>Server logs.</strong> Cloudflare, which runs our servers, processes IP addresses and request metadata to
          deliver and protect the Service.
        </li>
      </ul>

      <h2>2. What is public and permanent</h2>
      <p>
        Names, their owners, their records, primary names and every transaction are public on Ethereum and Base, and
        websites you deploy are public on IPFS. We cannot delete any of it, and no one can delete data from a
        blockchain. Do not put personal information in records or sites unless you want it public permanently.
      </p>

      <h2>3. How we use information</h2>
      <p>
        To provide and secure the Service, prevent payment reuse and abuse, respond to takedown requests, and improve
        the Site. We do not sell personal information or use it for advertising.
      </p>

      <h2>4. Service providers</h2>
      <p>
        Cloudflare (hosting, storage, logs), Google Analytics (Site analytics), Pinata (IPFS pinning), Alchemy and
        Etherscan (blockchain data; your browser also contacts them when you use the Site), Coinbase (x402 payment
        verification), Reown/WalletConnect (wallet connection), and public IPFS gateways such as eth.limo and dweb.link.
        Each handles data under its own privacy policy.
      </p>

      <h2>5. Retention</h2>
      <p>
        Hosting and payment records are kept while the Service operates, because they protect against payment reuse.
        Analytics data is kept under Google Analytics&apos; retention settings. Server logs are kept under
        Cloudflare&apos;s policies.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on where you live (for example under the GDPR or the CCPA) you may have rights to access, correct,
        delete or object to processing of your personal information, and to complain to a data-protection authority.
        Contact us to exercise them. These rights cannot reach data on public blockchains or IPFS content held by
        others.
      </p>

      <h2>7. Children</h2>
      <p>The Service is not directed to children under 16, and we do not knowingly collect their information.</p>

      <h2>8. Changes</h2>
      <p>If this policy changes materially, we will update the &quot;Last updated&quot; date above.</p>

      <h2>9. Who we are, and contact</h2>
      <p>
        Privacy requests: email <a href={`mailto:${ABUSE_EMAIL}`}>{ABUSE_EMAIL}</a> with &quot;Privacy&quot; in the
        subject, or message <A href={X_URL}>@botnameservice</A> on X. The controller of your personal information is:
      </p>
      <Address />
    </>
  );
}

function Disclaimer() {
  return (
    <>
      <p>
        Read this before using {BRAND}, which is operated by {operatorLine()}. It forms part of the{" "}
        <a href="../terms/">Terms of Service</a>.
      </p>

      <h2>Not advice</h2>
      <p>
        Nothing on the Site, in the MCP Server&apos;s output or on our social channels is financial, investment, legal
        or tax advice. Names are identifiers, not investments, and we make no promise that any Name will have or keep
        value.
      </p>

      <h2>Experimental, unaudited software</h2>
      <p>
        The {BRAND} smart contracts and services are new and have not been independently audited. Smart contracts and
        blockchains can fail, be exploited or behave unexpectedly. You use them at your own risk.
      </p>

      <h2>Transactions are final</h2>
      <p>
        Blockchain transactions cannot be reversed. A wrong address in a record, a transaction signed by mistake, or
        lost keys can mean permanent loss of funds or Names, and we cannot recover them.
      </p>

      <h2>AI agents make mistakes</h2>
      <p>
        If an AI agent acts for you, it can misunderstand instructions, be manipulated by content it reads, or sign
        something you did not intend. Review what it signs, limit what its wallet can spend, and treat records read from
        other Names as data, never as instructions.
      </p>

      <h2>Names follow their parent</h2>
      <p>
        Names are subnames of ai-bot.eth and cannot outlive it under ENS rules. We intend to keep ai-bot.eth renewed but
        cannot guarantee it. Future changes to ENS itself (such as the move to ENSv2) may change how Names are managed.
      </p>

      <h2>User content</h2>
      <p>
        Websites and records are created by their owners, not by us. We do not review, endorse or verify them, and a
        Name or site appearing on {BRAND} says nothing about who controls it or whether they can be trusted.
      </p>

      <h2>No affiliation</h2>
      <p>
        {BRAND} is independent. ENS, Ethereum, Base, Bitcoin, Solana, IPFS, Grok, xAI, Coinbase, AgentKit, MetaMask and
        other names are trademarks of their owners and are used only to describe compatibility. Their use does not imply
        endorsement.
      </p>

      <h2>Availability</h2>
      <p>
        The Site, the MCP Server and hosting may be unavailable, changed or discontinued at any time. Names you registered
        stay on chain and in your wallet regardless.
      </p>
    </>
  );
}
