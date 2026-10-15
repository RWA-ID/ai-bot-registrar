import { encodeFunctionData, getAddress, isAddress, type Hex } from "viem";
import { getCoderByCoinName } from "@ensdomains/address-encoder";
import { encode as encodeContenthash } from "@ensdomains/content-hash";
import { RESOLVER_ABI } from "./config.ts";

/**
 * Turning an agent's records ({ btc: "bc1…", base: "0x…", text: {…} }) into resolver calls.
 *
 * EVM chains use ENSIP-11 coin types (0x80000000 | chainId); Ethereum itself is 60.
 * Wallets look a chain up by its own coin type and the PublicResolver has no fallback
 * between them, so each chain a bot wants to be paid on is its own record.
 */

export const EVM_CHAINS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  optimism: 10,
  arbitrum: 42161,
  polygon: 137,
  bsc: 56,
  avalanche: 43114,
  gnosis: 100,
  linea: 59144,
  scroll: 534352,
  zksync: 324,
  celo: 42220,
  blast: 81457,
  mantle: 5000,
  zora: 7777777,
  unichain: 130,
  worldchain: 480,
  sonic: 146,
  berachain: 80094,
  ink: 57073,
  abstract: 2741,
};

const ALIASES: Record<string, string> = {
  eth: "ethereum",
  mainnet: "ethereum",
  op: "optimism",
  arb: "arbitrum",
  arb1: "arbitrum",
  "arbitrum-one": "arbitrum",
  matic: "polygon",
  pol: "polygon",
  bnb: "bsc",
  "bnb-chain": "bsc",
  // ENSIP-11 exception: "avax" is the X-chain format (SLIP-44 9000); the EVM C-chain is "avalanche"
  avaxc: "avalanche",
  "avalanche-c": "avalanche",
  gno: "gnosis",
  xdai: "gnosis",
  era: "zksync",
  "zksync-era": "zksync",
  world: "worldchain",
  bitcoin: "btc",
  solana: "sol",
  litecoin: "ltc",
  dogecoin: "doge",
};

/** `evm` writes one address to every chain in EVM_CHAINS, plus the ENSIP-19 default record. */
export const ALL_EVM_KEY = "evm";
/** ENSIP-19 default EVM coin type. Newer resolvers fall back to it; the PublicResolver does not. */
export const DEFAULT_EVM_COIN_TYPE = 0x80000000n;

export const MAX_RECORD_CALLS = 40;

export function evmCoinType(chainId: number): bigint {
  return chainId === 1 ? 60n : 0x80000000n | BigInt(chainId);
}

export interface RecordsInput {
  /** coin or chain -> address. Keys: an EVM chain name, `evm:<chainId>`, `evm` (all chains), or a coin symbol (btc, sol, ltc, doge, ...). An empty string clears the record. */
  addresses?: Record<string, string>;
  /** text records (avatar, url, description, com.twitter, ...). An empty string clears one. */
  text?: Record<string, string>;
  /** ipfs://<cid> or ipns://<name>; an empty string clears it */
  contenthash?: string;
}

export interface RecordWrite {
  record: string;
  value: string;
}

interface AddressWrite {
  coinType: bigint;
  label: string;
  bytes: Hex;
  value: string;
}

class RecordError extends Error {}

function evmBytes(key: string, address: string): Hex {
  if (address === "") return "0x";
  if (!isAddress(address, { strict: false })) throw new RecordError(`${key}: "${address}" is not an EVM address`);
  return getAddress(address).toLowerCase() as Hex;
}

function toHex(bytes: Uint8Array): Hex {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function addressWrites(key: string, address: string): AddressWrite[] {
  const k = key.trim().toLowerCase();
  const name = ALIASES[k] ?? k;
  const value = address.trim();

  if (name === ALL_EVM_KEY) {
    const bytes = evmBytes(key, value);
    return [
      ...Object.entries(EVM_CHAINS).map(([chain, id]) => ({ coinType: evmCoinType(id), label: chain, bytes, value })),
      { coinType: DEFAULT_EVM_COIN_TYPE, label: "evm default (ENSIP-19)", bytes, value },
    ];
  }
  const generic = /^evm:(\d{1,12})$/.exec(name);
  if (generic) {
    const id = Number(generic[1]);
    return [{ coinType: evmCoinType(id), label: `evm chain ${id}`, bytes: evmBytes(key, value), value }];
  }
  if (name in EVM_CHAINS) {
    return [{ coinType: evmCoinType(EVM_CHAINS[name]), label: name, bytes: evmBytes(key, value), value }];
  }

  // Any other coin the ENS address encoder knows (btc, sol, ltc, doge, atom, trx, xrp, ...)
  let coder;
  try {
    coder = getCoderByCoinName(name);
  } catch {
    throw new RecordError(
      `${key}: unknown coin or chain. Use an EVM chain (${Object.keys(EVM_CHAINS).join(", ")}), "evm:<chainId>", "evm" for all EVM chains, or a coin symbol such as btc, sol, ltc, doge.`
    );
  }
  if (value === "") return [{ coinType: BigInt(coder.coinType), label: coder.name, bytes: "0x", value }];
  let decoded: Uint8Array;
  try {
    decoded = coder.decode(value);
  } catch {
    throw new RecordError(`${key}: "${value}" is not a valid ${coder.name.toUpperCase()} address`);
  }
  return [{ coinType: BigInt(coder.coinType), label: coder.name, bytes: toHex(decoded), value }];
}

export function encodeContenthashValue(value: string): Hex {
  const v = value.trim();
  if (v === "") return "0x";
  const m = /^(ipfs|ipns):\/\/([A-Za-z0-9.-]+)\/?$/.exec(v);
  if (!m) throw new RecordError(`contenthash: use ipfs://<cid> or ipns://<name>, got "${value}"`);
  try {
    return `0x${encodeContenthash(m[1] === "ipfs" ? "ipfs" : "ipns", m[2])}` as Hex;
  } catch {
    throw new RecordError(`contenthash: "${m[2]}" is not a valid ${m[1].toUpperCase()} identifier`);
  }
}

/**
 * Resolver calldata for `records` on `node`, plus a readable summary. Throws RecordError on bad input.
 * `defaults` are addresses written only for coin types `records` leaves unset (the caller's own wins).
 */
export function encodeRecords(
  node: Hex,
  records: RecordsInput,
  defaults: Record<string, string> = {}
): { calls: Hex[]; writes: RecordWrite[] } {
  const calls: Hex[] = [];
  const writes: RecordWrite[] = [];
  const seen = new Map<bigint, string>();
  const given = Object.entries(records.addresses ?? {}).map(([k, v]) => ({ k, v, isDefault: false }));
  const fallback = Object.entries(defaults).map(([k, v]) => ({ k, v, isDefault: true }));

  for (const { k: key, v: address, isDefault } of [...given, ...fallback]) {
    for (const w of addressWrites(key, address)) {
      const prior = seen.get(w.coinType);
      if (prior !== undefined && prior !== w.value && !isDefault) {
        throw new RecordError(`${w.label} is given two different addresses (${prior} and ${w.value})`);
      }
      if (prior !== undefined) continue;
      seen.set(w.coinType, w.value);
      calls.push(
        w.coinType === 60n && w.bytes !== "0x"
          ? encodeFunctionData({ abi: RESOLVER_ABI, functionName: "setAddr", args: [node, getAddress(w.value)] })
          : encodeFunctionData({ abi: RESOLVER_ABI, functionName: "setAddr", args: [node, w.coinType, w.bytes] })
      );
      writes.push({ record: `address:${w.label}`, value: w.value || "(cleared)" });
    }
  }

  for (const [key, value] of Object.entries(records.text ?? {})) {
    if (!/^[A-Za-z0-9._:-]{1,64}$/.test(key)) throw new RecordError(`text key "${key}" is not allowed`);
    if (value.length > 2048) throw new RecordError(`text "${key}" is longer than 2048 characters`);
    calls.push(encodeFunctionData({ abi: RESOLVER_ABI, functionName: "setText", args: [node, key, value] }));
    writes.push({ record: `text:${key}`, value: value || "(cleared)" });
  }

  if (records.contenthash !== undefined) {
    calls.push(
      encodeFunctionData({
        abi: RESOLVER_ABI,
        functionName: "setContenthash",
        args: [node, encodeContenthashValue(records.contenthash)],
      })
    );
    writes.push({ record: "contenthash", value: records.contenthash || "(cleared)" });
  }

  if (calls.length > MAX_RECORD_CALLS) {
    throw new RecordError(`${calls.length} records in one transaction; the limit is ${MAX_RECORD_CALLS}`);
  }
  return { calls, writes };
}

export { RecordError };
