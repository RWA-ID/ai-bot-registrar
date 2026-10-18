import { getAddress, type Address, type Hex, type PublicClient } from "viem";
import { baseClient, mainnetClient } from "./chain.ts";
import type { Env } from "./config.ts";

/*
 * PayBox signs a transaction but doesn't fill one in. Handed {to, value, data}
 * it has no nonce, so the user had to supply one by hand (seen on yournames.io's
 * connector, the same shape as here). Every transaction Bot Names returns
 * therefore also carries `transaction`: complete, in eth_signTransaction's
 * wire format, ready to sign as is.
 *
 *   nonce - the sender's pending count on that chain, +1 for each earlier
 *           transaction on the same chain in the same reply.
 *   gas   - estimated +25%; when the estimate fails (an underfunded wallet, or a
 *           step that depends on an unmined earlier one) a fixed limit well
 *           above real use. Unused gas isn't charged.
 *   fees  - max fee = 2 x the current base fee + tip, so a signature made a few
 *           minutes later still lands. EIP-1559 charges the real base fee.
 */

export type PreparedTx = {
  chain_id: number;
  to: Address;
  value: string;
  data: Hex;
  description: string;
  [k: string]: unknown;
};

export type SignableTx = {
  from: Address;
  to: Address;
  data: Hex;
  value: Hex;
  nonce: Hex;
  gas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  chainId: Hex;
  type: "0x2";
};

const FALLBACK_GAS: Record<number, bigint> = { 1: 500_000n, 8453: 200_000n };

const hex = (n: bigint | number) => `0x${n.toString(16)}` as Hex;

/** Adds `from`, `nonce`, `gas` and a complete `transaction` to each tx, in place. */
export async function completeTxs(env: Env, from: Address, txs: PreparedTx[]): Promise<void> {
  const sender = getAddress(from);
  const byChain = new Map<number, PreparedTx[]>();
  for (const t of txs) byChain.set(t.chain_id, [...(byChain.get(t.chain_id) ?? []), t]);

  await Promise.all(
    [...byChain].map(async ([chainId, list]) => {
      const client: PublicClient = chainId === 8453 ? baseClient(env) : mainnetClient(env);
      const [nonce, block, tip] = await Promise.all([
        client.getTransactionCount({ address: sender, blockTag: "pending" }),
        client.getBlock({ blockTag: "latest" }),
        client.estimateMaxPriorityFeePerGas().catch(() => (chainId === 1 ? 1_000_000_000n : 1_000_000n)),
      ]);
      const maxFee = (block.baseFeePerGas ?? 0n) * 2n + tip;

      await Promise.all(
        list.map(async (t, i) => {
          let gas: bigint;
          try {
            gas = ((await client.estimateGas({ account: sender, to: t.to, data: t.data, value: BigInt(t.value) })) * 125n) / 100n;
          } catch {
            gas = FALLBACK_GAS[chainId] ?? 300_000n;
          }
          t.from = sender;
          t.nonce = nonce + i;
          t.gas = gas.toString();
          t.transaction = {
            from: sender,
            to: t.to,
            data: t.data,
            value: hex(BigInt(t.value)),
            nonce: hex(nonce + i),
            gas: hex(gas),
            maxFeePerGas: hex(maxFee),
            maxPriorityFeePerGas: hex(tip),
            chainId: hex(chainId),
            type: "0x2",
          } satisfies SignableTx;
        })
      );
    })
  );
}
