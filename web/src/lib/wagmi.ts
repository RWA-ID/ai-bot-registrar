import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";
import { http, fallback } from "wagmi";

const ALCHEMY_RPC_URL = import.meta.env.VITE_ALCHEMY_RPC_URL;

export const config = getDefaultConfig({
  appName: "AI Bot Registrar",
  projectId: "43bdd1b8c477ac4d4a4264a14a8472f8",
  appUrl: "https://ai-bot.eth.link",
  chains: [mainnet],
  transports: {
    [mainnet.id]: fallback([
      ...(ALCHEMY_RPC_URL ? [http(ALCHEMY_RPC_URL)] : []),
      http("https://eth.llamarpc.com"),
    ]),
  },
  ssr: false,
});
