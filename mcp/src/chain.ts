import {
  createPublicClient,
  decodeEventLog,
  fallback,
  getAddress,
  hexToBytes,
  http,
  namehash,
  pad,
  toHex,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { base, mainnet } from "viem/chains";
import { normalize, packetToBytes } from "viem/ens";
import { getCoderByCoinType } from "@ensdomains/address-encoder";
import {
  NAME_WRAPPER,
  NAME_WRAPPER_ABI,
  PARENT,
  PARENT_CANNOT_CONTROL,
  REGISTRAR,
  REGISTRAR_ABI,
  REGISTRAR_DEPLOY_BLOCK,
  UNIVERSAL_RESOLVER,
  UNIVERSAL_RESOLVER_ABI,
  V1_REGISTRAR,
  V1_REGISTRAR_ABI,
  type Env,
} from "./config.ts";
import { EVM_CHAINS, evmCoinType } from "./records.ts";

// Keyed endpoint first: public RPCs rate-limit Cloudflare's shared egress IPs.
export function mainnetClient(env: Env): PublicClient {
  return createPublicClient({
    chain: mainnet,
    transport: fallback([
      ...(env.MAINNET_RPC_URL ? [http(env.MAINNET_RPC_URL)] : []),
      http("https://gateway.tenderly.co/public/mainnet"),
      http("https://eth.api.onfinality.io/public"),
    ]),
    batch: { multicall: true },
  }) as PublicClient;
}

export function baseClient(env: Env): PublicClient {
  return createPublicClient({
    chain: base,
    transport: fallback([
      ...(env.BASE_RPC_URL ? [http(env.BASE_RPC_URL)] : []),
      http("https://mainnet.base.org"),
      http("https://base.gateway.tenderly.co"),
    ]),
  }) as PublicClient;
}

/** "mybot", "mybot.ai-bot.eth" or "MyBot.ai-bot.eth" -> normalized full name + label (label only for Bot Names). */
export function parseName(input: string): { name: string; label: string | null } {
  const raw = input.trim().replace(/\.$/, "");
  const full = raw.includes(".") ? raw : `${raw}.${PARENT}`;
  const name = normalize(full);
  const suffix = `.${PARENT}`;
  const label = name.endsWith(suffix) && !name.slice(0, -suffix.length).includes(".") ? name.slice(0, -suffix.length) : null;
  return { name, label };
}

export interface NameState {
  name: string;
  /** Holder of the wrapped name; null when nobody holds it (or it expired). */
  owner: Address | null;
  expires_at: string | null;
  parent_can_control: boolean | null;
}

export async function getNameState(client: PublicClient, name: string): Promise<NameState> {
  const [owner, fuses, expiry] = await client.readContract({
    address: NAME_WRAPPER,
    abi: NAME_WRAPPER_ABI,
    functionName: "getData",
    args: [BigInt(namehash(name))],
  });
  const held = owner !== zeroAddress;
  return {
    name,
    owner: held ? getAddress(owner) : null,
    expires_at: held && expiry > 0n ? new Date(Number(expiry) * 1000).toISOString() : null,
    parent_can_control: held ? (fuses & PARENT_CANNOT_CONTROL) === 0 : null,
  };
}

/** The resolver set on `name` itself (via the Universal Resolver, survives ENSv2), or null. */
export async function findOwnResolver(client: PublicClient, name: string): Promise<Address | null> {
  const [resolver, , offset] = await client.readContract({
    address: UNIVERSAL_RESOLVER,
    abi: UNIVERSAL_RESOLVER_ABI,
    functionName: "findResolver",
    args: [toHex(packetToBytes(name))],
  });
  // offset > 0 means the resolver belongs to a parent (wildcard), not to this name
  return resolver === zeroAddress || offset !== 0n ? null : getAddress(resolver);
}

const LOOKUP_COINS: { label: string; coinType: bigint }[] = [
  ...Object.entries(EVM_CHAINS).map(([label, id]) => ({ label, coinType: evmCoinType(id) })),
  { label: "btc", coinType: 0n },
  { label: "sol", coinType: 501n },
  { label: "ltc", coinType: 2n },
  { label: "doge", coinType: 3n },
];
const LOOKUP_TEXT = ["avatar", "url", "description", "com.twitter", "com.github", "org.telegram", "email"];

/** Each field is a value, null (unset) or an error string - a failed read is never reported as "unset". */
export async function lookupName(client: PublicClient, name: string) {
  const settle = async <T>(p: Promise<T>) => {
    try {
      return { ok: true as const, value: await p };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message.split("\n")[0] : String(e) };
    }
  };
  const [addrs, texts, contenthash] = await Promise.all([
    Promise.all(LOOKUP_COINS.map((c) => settle(client.getEnsAddress({ name, coinType: c.coinType })))),
    Promise.all(LOOKUP_TEXT.map((k) => settle(client.getEnsText({ name, key: k })))),
    settle(readContenthash(client, name)),
  ]);
  const out = { addresses: {} as Record<string, string>, text: {} as Record<string, string>, contenthash: null as string | null, errors: {} as Record<string, string> };
  LOOKUP_COINS.forEach((c, i) => {
    const r = addrs[i];
    if (!r.ok) out.errors[`address:${c.label}`] = r.error;
    else if (r.value) {
      try {
        out.addresses[c.label] = displayAddress(c.coinType, r.value);
      } catch {
        out.errors[`address:${c.label}`] = `record holds bytes that are not a valid ${c.label} address: ${r.value}`;
      }
    }
  });
  LOOKUP_TEXT.forEach((k, i) => {
    const r = texts[i];
    if (!r.ok) out.errors[`text:${k}`] = r.error;
    else if (r.value) out.text[k] = r.value;
  });
  if (!contenthash.ok) out.errors.contenthash = contenthash.error;
  else out.contenthash = contenthash.value;
  return out;
}

/** viem returns non-EVM records as raw ENSIP-9 bytes; render them in the coin's own format (bc1…, base58, …). */
function displayAddress(coinType: bigint, value: string): string {
  const isEvm = coinType === 60n || coinType >= 0x80000000n;
  if (isEvm) return value;
  return getCoderByCoinType(Number(coinType)).encode(hexToBytes(value as Hex));
}

async function readContenthash(client: PublicClient, name: string): Promise<string | null> {
  const resolver = await client.getEnsResolver({ name });
  if (!resolver || resolver === zeroAddress) return null;
  const { decode, getCodec } = await import("@ensdomains/content-hash");
  const raw = (await client.readContract({
    address: resolver,
    abi: [{ type: "function", name: "contenthash", stateMutability: "view", inputs: [{ name: "node", type: "bytes32" }], outputs: [{ type: "bytes" }] }],
    functionName: "contenthash",
    args: [namehash(name)],
  })) as Hex;
  if (!raw || raw === "0x") return null;
  const codec = getCodec(raw.slice(2));
  return codec ? `${codec}://${decode(raw.slice(2))}` : raw;
}

/**
 * Bot Names held by `owner`: names registered to it through either registrar (v2 logs via
 * Etherscan, v1's on-chain list), kept only if `owner` still holds them.
 */
export async function listNames(client: PublicClient, env: Env, owner: Address) {
  const labels = new Set<string>();
  const errors: string[] = [];

  if (env.ETHERSCAN_API_KEY) {
    try {
      const url =
        `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&address=${REGISTRAR}` +
        `&fromBlock=${REGISTRAR_DEPLOY_BLOCK}&toBlock=latest&topic2=${pad(owner)}&apikey=${env.ETHERSCAN_API_KEY}`;
      const data = (await (await fetch(url)).json()) as { result: unknown };
      if (!Array.isArray(data.result)) throw new Error(String(data.result));
      for (const log of data.result as { data: Hex; topics: [Hex, ...Hex[]] }[]) {
        try {
          const ev = decodeEventLog({ abi: REGISTRAR_ABI, eventName: "NameRegistered", data: log.data, topics: log.topics });
          labels.add(ev.args.label);
        } catch {
          // another event
        }
      }
    } catch (e) {
      errors.push(`registrar log scan failed: ${e instanceof Error ? e.message : e}`);
    }
  } else {
    errors.push("registrar log scan unavailable (no Etherscan key configured)");
  }

  try {
    const v1 = await client.readContract({ address: V1_REGISTRAR, abi: V1_REGISTRAR_ABI, functionName: "getAgentSubdomains", args: [owner] });
    v1.forEach((l) => labels.add(l));
  } catch (e) {
    errors.push(`v1 registrar read failed: ${e instanceof Error ? e.message.split("\n")[0] : e}`);
  }

  const states = await Promise.all([...labels].map((l) => getNameState(client, `${l}.${PARENT}`)));
  const names = states.filter((s) => s.owner?.toLowerCase() === owner.toLowerCase());
  return { names, errors };
}
