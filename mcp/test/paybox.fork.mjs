// The PayBox path, in-process against an anvil mainnet fork (anvil --fork-url $MAINNET_RPC_URL --port 8545):
// a signing-only wallet signs the `transaction` object exactly as returned, with nothing looked up
// or filled in, and send_transaction broadcasts it. Proves the nonce, gas and fees Bot Names fills
// in are complete and valid, across a two-transaction reply.
//
//   node --experimental-strip-types --no-warnings test/paybox.fork.mjs
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createTestClient, http } from "viem";
import { mainnet } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createServer } from "../src/server.ts";
import { CARD_URI } from "../src/card.ts";

const RPC = "http://127.0.0.1:8545";
const eth = createTestClient({ mode: "anvil", chain: mainnet, transport: http(RPC) });
const env = { MAINNET_RPC_URL: RPC, BASE_RPC_URL: process.env.BASE_RPC_URL, SAFE_ADDRESS: "0x5707Ad7526cF369bEa7af8732A7Af91d3e231C4e", PUBLIC_URL: "https://botnames.dev" };

const [ct, st] = InMemoryTransport.createLinkedPair();
await createServer(env).connect(st);
const client = new Client({ name: "paybox-fork", version: "0" });
await client.connect(ct);
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  return { isError: !!r.isError, data: r.structuredContent ?? {} };
};
const step = (m) => console.log(`  ok   ${m}`);

// What PayBox does with {op: "transaction", transaction}: sign the object as given.
const signAsGiven = (account, t) =>
  account.signTransaction({
    chainId: Number(t.chainId),
    type: "eip1559",
    to: t.to,
    data: t.data,
    value: BigInt(t.value),
    nonce: Number(t.nonce),
    gas: BigInt(t.gas),
    maxFeePerGas: BigInt(t.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(t.maxPriorityFeePerGas),
  });

const { tools } = await client.listTools();
for (const n of ["register_name", "set_records", "set_primary_name", "deploy_site"]) {
  assert.equal(tools.find((t) => t.name === n)?._meta?.ui?.resourceUri, CARD_URI, n);
}
const res = await client.readResource({ uri: CARD_URI });
assert.equal(res.contents[0].mimeType, "text/html;profile=mcp-app");
step("write tools carry the Bot Names card; the card is an MCP App");

const wallet = privateKeyToAccount(generatePrivateKey());
await eth.setBalance({ address: wallet.address, value: 10n ** 17n });
const label = `paybox${Date.now().toString(36)}`;

let r = await call("register_name", { name: label, owner: wallet.address });
assert.ok(!r.isError, JSON.stringify(r.data));
const t = r.data.transaction.transaction;
assert.equal(t.nonce, "0x0");
assert.equal(t.chainId, "0x1");
assert.equal(r.data.card.action, "register");
r = await call("send_transaction", { signed_transaction: await signAsGiven(wallet, t) });
assert.equal(r.data.status, "success", JSON.stringify(r.data));
step(`register_name: signed as given (nonce 0, gas ${BigInt(t.gas)}) and mined`);

// Two records transactions? Only for names without a resolver; a v2 name has one, so one tx here.
r = await call("set_records", { name: label, records: { text: { description: "signed by a PayBox-shaped wallet" } } });
assert.ok(!r.isError, JSON.stringify(r.data));
const recs = r.data.transactions;
assert.equal(recs[0].transaction.nonce, "0x1", "the nonce moved on after the register");
for (const x of recs) {
  const s = await call("send_transaction", { signed_transaction: await signAsGiven(wallet, x.transaction) });
  assert.equal(s.data.status, "success", JSON.stringify(s.data));
}
step(`set_records: ${recs.length} transaction(s), nonce 1, signed as given and mined`);

r = await call("set_primary_name", { name: `${label}.ai-bot.eth`, address: wallet.address });
assert.ok(!r.isError, JSON.stringify(r.data));
const p = r.data.transactions[0].transaction;
assert.equal(p.nonce, "0x2");
r = await call("send_transaction", { signed_transaction: await signAsGiven(wallet, p) });
assert.equal(r.data.status, "success", JSON.stringify(r.data));
r = await call("resolve", { query: wallet.address });
assert.equal(r.data.primary_name, `${label}.ai-bot.eth`);
step("set_primary_name: nonce 2, mined; the address now resolves to the name");

// A stale transaction: re-sign the register (nonce 0, already used) - must say stale, not hang 90 s.
const t0 = Date.now();
r = await call("send_transaction", { signed_transaction: await signAsGiven(wallet, { ...p, nonce: "0x0" }) });
assert.ok(r.isError && /stale/.test(r.data.error), JSON.stringify(r.data));
assert.ok(Date.now() - t0 < 20_000);
step("a used nonce is reported stale at once, not waited on");

console.log(`\nPayBox fork OK (${label}.ai-bot.eth)`);
await client.close();
process.exit(0);
