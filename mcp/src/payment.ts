import { createFacilitatorConfig } from "@coinbase/x402";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { decodeEventLog, encodeFunctionData, getAddress, isHash, type Address, type Hex } from "viem";
import { baseClient } from "./chain.ts";
import {
  BASE_NETWORK,
  ERC20_ABI,
  PAYMENT_TX_MAX_AGE_S,
  SITE_PRICE_USD,
  SITE_PRICE_USDC_UNITS,
  USDC_BASE,
  type Env,
} from "./config.ts";

/**
 * Two ways to pay for a site deploy, both 0.25 USDC on Base to the Bot Names Safe:
 *  1. x402 over MCP (`_meta["x402/payment"]`), for clients that speak it.
 *  2. A plain USDC transfer the agent's wallet sends itself; the agent passes the tx hash.
 *     Any wallet that can sign the registration can do this, x402 support or not.
 */

let paidWrapper: Promise<ReturnType<typeof createPaymentWrapper>> | null = null;

/** One x402 wrapper per isolate: the facilitator client syncs /supported once. */
export function getPaidWrapper(env: Env) {
  if (!env.CDP_API_KEY_ID || !env.CDP_API_KEY_SECRET) return null;
  paidWrapper ??= (async () => {
    const facilitator = new HTTPFacilitatorClient(createFacilitatorConfig(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET));
    const server = new x402ResourceServer(facilitator).register(BASE_NETWORK, new ExactEvmScheme());
    await server.initialize();
    const accepts = await server.buildPaymentRequirements({
      scheme: "exact",
      network: BASE_NETWORK,
      payTo: env.SAFE_ADDRESS,
      price: SITE_PRICE_USD,
    });
    return createPaymentWrapper(server, {
      accepts,
      resource: { url: "mcp://tool/deploy_site", description: "Deploy a website for a Bot Name to IPFS", mimeType: "application/json" },
    });
  })().catch((e) => {
    paidWrapper = null; // retry on the next call instead of caching a failure
    throw e;
  });
  return paidWrapper;
}

/** The verified payer of an x402 payment, from the context the wrapper hands the tool handler. */
export function x402Payer(ctx: unknown): Address | null {
  const meta = (ctx as { meta?: Record<string, unknown> } | undefined)?.meta;
  const payment = meta?.["x402/payment"] as { payload?: { authorization?: { from?: string } } } | undefined;
  const from = payment?.payload?.authorization?.from;
  return from ? getAddress(from) : null;
}

/** Unsigned USDC transfer that pays for one deploy. */
export function sitePaymentTx(env: Env) {
  return {
    chain_id: 8453,
    to: USDC_BASE,
    value: "0",
    data: encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [env.SAFE_ADDRESS, SITE_PRICE_USDC_UNITS] }),
    description: `Transfer 0.25 USDC on Base to the Bot Names Safe ${env.SAFE_ADDRESS}`,
  };
}

export class PaymentError extends Error {}

/**
 * Check a plain USDC payment on Base: success, a Transfer of >= 0.25 USDC to the Safe, recent,
 * and never used before. Returns the paying address. Reserves the hash; call release() if the
 * deploy then fails so the agent can retry with the same payment.
 */
export async function claimPaymentTx(env: Env, txHash: string): Promise<{ payer: Address; release: () => Promise<void>; commit: (note: string) => Promise<void> }> {
  if (!isHash(txHash)) throw new PaymentError("payment_tx must be a 0x-prefixed 32-byte transaction hash.");
  const key = `paid:${txHash.toLowerCase()}`;
  const prior = await env.SITES.get(key);
  if (prior) throw new PaymentError(`This payment was already used (${prior}). Each deploy needs its own payment.`);

  const client = baseClient(env);
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as Hex });
  } catch {
    throw new PaymentError("Payment transaction not found on Base yet. Wait for it to be mined, then retry.");
  }
  if (receipt.status !== "success") throw new PaymentError("The payment transaction reverted on Base.");

  let payer: Address | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== USDC_BASE.toLowerCase()) continue;
    try {
      const ev = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics });
      if (ev.eventName === "Transfer" && ev.args.to.toLowerCase() === env.SAFE_ADDRESS.toLowerCase() && ev.args.value >= SITE_PRICE_USDC_UNITS) {
        payer = getAddress(ev.args.from);
        break;
      }
    } catch {
      // not a Transfer
    }
  }
  if (!payer) throw new PaymentError(`No transfer of at least 0.25 USDC to ${env.SAFE_ADDRESS} in that transaction.`);

  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (Date.now() / 1000 - Number(block.timestamp) > PAYMENT_TX_MAX_AGE_S) {
    throw new PaymentError("That payment is more than 7 days old. Send a new one.");
  }

  // KV has no compare-and-set; this narrows (not closes) a race between two calls with one hash.
  await env.SITES.put(key, `reserved ${new Date().toISOString()}`, { expirationTtl: 600 });
  return {
    payer,
    release: () => env.SITES.delete(key),
    commit: (note: string) => env.SITES.put(key, note),
  };
}
