import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, type AppKitNetwork } from "@reown/appkit/networks";
import { http, fallback } from "wagmi";

const ALCHEMY_RPC_URL = import.meta.env.VITE_ALCHEMY_RPC_URL;

export const PROJECT_ID = "43bdd1b8c477ac4d4a4264a14a8472f8";

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: PROJECT_ID,
  ssr: false,
  transports: {
    [mainnet.id]: fallback([
      ...(ALCHEMY_RPC_URL ? [http(ALCHEMY_RPC_URL)] : []),
      http("https://eth.llamarpc.com"),
    ]),
  },
});

export const config = wagmiAdapter.wagmiConfig;

// Email/socials/onramp are remote features: the Reown dashboard decides them
// for the whole project, so `features` below is only the offline fallback.
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: PROJECT_ID,
  metadata: {
    name: "AI Bot Registrar",
    description: "ENS subdomains for AI agents under ai-bot.eth",
    url: "https://ai-bot.eth.link",
    // Wallets draw this small and square beside the signing prompt — keep it a square PNG.
    icons: ["https://ai-bot.eth.link/app-icon.png"],
  },
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#c8f53c",
    "--w3m-border-radius-master": "0px",
  },
});

// AppKit's embedded (email/social) wallet answers eth_chainId with a CAIP-2
// string, so viem throws before signing unless the write passes `chain: null`.
export const isEmbeddedWallet = (connectorId?: string) => connectorId === "AUTH";
