import { namehash, parseAbi } from "viem";

export interface Env {
  SITES: KVNamespace;
  /** Bot Names Safe: receives site-deploy payments on Base. */
  SAFE_ADDRESS: `0x${string}`;
  PUBLIC_URL: string;
  // Secrets (wrangler secret put …), never in [vars] - a var re-applied on deploy would shadow them:
  MAINNET_RPC_URL?: string;
  BASE_RPC_URL?: string;
  ETHERSCAN_API_KEY?: string;
  PINATA_JWT?: string;
  CDP_API_KEY_ID?: string;
  CDP_API_KEY_SECRET?: string;
  /** Bearer token for POST /admin/takedown */
  ADMIN_TOKEN?: string;
}

export const PARENT = "ai-bot.eth";
export const PARENT_NODE = namehash(PARENT);

export const REGISTRAR = "0x52bf7D9A2F50ED9707c573FEAC708716E49B4275" as const;
export const REGISTRAR_DEPLOY_BLOCK = 26_198_609;
export const V1_REGISTRAR = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89" as const;
export const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401" as const;
export const UNIVERSAL_RESOLVER = "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe" as const;
export const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as const;

export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const BASE_NETWORK = "eip155:8453" as const;
export const SITE_PRICE_USD = "$0.25";
export const SITE_PRICE_USDC_UNITS = 250_000n; // 6 decimals
/** A plain USDC payment tx is accepted for this long after it is mined. */
export const PAYMENT_TX_MAX_AGE_S = 7 * 24 * 3600;

export const MAX_SITE_BYTES = 10 * 1024 * 1024;
export const MAX_SITE_FILES = 500;

export const REGISTRAR_ABI = parseAbi([
  "function register(string label, address owner, bytes[] records) payable returns (bytes32)",
  "function available(string label) view returns (bool)",
  "function validLabel(string label) pure returns (bool)",
  "function fee() view returns (uint256)",
  "event NameRegistered(string label, bytes32 indexed labelhash, bytes32 node, address indexed owner, address indexed payer, uint256 fee)",
]);

export const V1_REGISTRAR_ABI = parseAbi(["function getAgentSubdomains(address agent) view returns (string[])"]);

export const NAME_WRAPPER_ABI = parseAbi([
  "function getData(uint256 id) view returns (address owner, uint32 fuses, uint64 expiry)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setResolver(bytes32 node, address resolver)",
]);

export const UNIVERSAL_RESOLVER_ABI = parseAbi([
  "function findResolver(bytes name) view returns (address resolver, bytes32 node, uint256 offset)",
]);

export const RESOLVER_ABI = parseAbi([
  "function setAddr(bytes32 node, address a)",
  "function setAddr(bytes32 node, uint256 coinType, bytes a)",
  "function setText(bytes32 node, string key, string value)",
  "function setContenthash(bytes32 node, bytes hash)",
  "function multicallWithNodeCheck(bytes32 nodehash, bytes[] data) returns (bytes[])",
]);

export const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const PARENT_CANNOT_CONTROL = 1 << 16;
