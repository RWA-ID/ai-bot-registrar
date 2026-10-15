// End to end against `wrangler dev` + anvil forks of Ethereum (8545) and Base (8546).
// Every transaction the MCP returns is sent from an impersonated wallet, as an agent's wallet would.
//   node test/e2e.fork.mjs http://127.0.0.1:8787/mcp
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createTestClient, http, publicActions, walletActions, keccak256, encodeAbiParameters, pad, toHex } from "viem";
import { base, mainnet } from "viem/chains";
import assert from "node:assert/strict";

const MCP = process.argv[2] ?? "http://127.0.0.1:8787/mcp";
const eth = createTestClient({ chain: mainnet, mode: "anvil", transport: http("http://127.0.0.1:8545") }).extend(publicActions).extend(walletActions);
const bas = createTestClient({ chain: base, mode: "anvil", transport: http("http://127.0.0.1:8546") }).extend(publicActions).extend(walletActions);

const AGENT = "0x00000000000000000000000000000000000a6e17";
const STRANGER = "0x0000000000000000000000000000000005742a9e";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const label = `e2e-bot-${Date.now().toString(36)}`;
const name = `${label}.ai-bot.eth`;

const client = new Client({ name: "e2e", version: "1" });
await client.connect(new StreamableHTTPClientTransport(new URL(MCP)));
const call = async (tool, args) => {
  const r = await client.callTool({ name: tool, arguments: args });
  return { ...r, data: r.structuredContent ?? JSON.parse(r.content[0].text) };
};
async function send(chain, from, t) {
  assert.equal(t.chain_id, chain.chain.id, `tx for chain ${t.chain_id} sent on ${chain.chain.id}`);
  const hash = await chain.sendTransaction({ account: from, to: t.to, data: t.data, value: BigInt(t.value), chain: chain.chain });
  const rc = await chain.waitForTransactionReceipt({ hash });
  assert.equal(rc.status, "success", `${t.description} reverted`);
  return hash;
}
const step = (s) => console.log(`- ${s}`);

for (const [c, a] of [[eth, AGENT], [eth, STRANGER], [bas, AGENT], [bas, STRANGER]]) {
  await c.impersonateAccount({ address: a });
  await c.setBalance({ address: a, value: 10n ** 18n });
}
// 5 USDC each on Base: FiatToken balances live at mapping slot 9
for (const a of [AGENT, STRANGER]) {
  const slot = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [a, 9n]));
  await bas.setStorageAt({ address: USDC, index: slot, value: pad(toHex(5_000_000n)) });
}

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
assert.deepEqual(tools, ["check_name", "deploy_site", "list_names", "register_name", "resolve", "set_records"]);
step(`tools: ${tools.join(", ")}`);

let r = await call("check_name", { name: label });
assert.equal(r.data.available, true);
assert.equal(r.data.fee_eth, "0.001");
step(`check_name ${name}: available, ${r.data.fee_eth} ETH`);
assert.equal((await call("check_name", { name: "klumpai" })).data.available, false);
assert.equal((await call("check_name", { name: "Bad_Name" })).data.valid, false);

r = await call("register_name", {
  name,
  owner: AGENT,
  from: AGENT,
  records: {
    addresses: { btc: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", sol: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1", arbitrum: AGENT },
    text: { description: "e2e test bot", "com.twitter": "botnameservice" },
  },
});
assert.ok(!r.isError, JSON.stringify(r.data));
assert.ok(r.data.estimate, "estimate missing");
step(`register_name: ${r.data.records.length} records, est. ${r.data.estimate.gas} gas`);
await send(eth, AGENT, r.data.transaction);

r = await call("resolve", { query: name });
assert.equal(r.data.owner.toLowerCase(), AGENT);
assert.equal(r.data.addresses.ethereum.toLowerCase(), AGENT);
assert.equal(r.data.addresses.base.toLowerCase(), AGENT);
assert.equal(r.data.addresses.arbitrum.toLowerCase(), AGENT);
assert.equal(r.data.addresses.btc, "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
assert.equal(r.data.addresses.sol, "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
assert.equal(r.data.text.description, "e2e test bot");
assert.equal(r.data.parent_can_control, false);
assert.deepEqual(r.data.errors, {});
step("resolve: ETH, Base, Arbitrum, BTC, SOL, text all read back; parent cannot control");

r = await call("set_records", { name, from: STRANGER, records: { text: { url: "https://evil.example" } } });
assert.ok(r.isError && /does not own/.test(r.data.error));
r = await call("set_records", { name, from: AGENT, records: { text: { url: "https://botnames.dev" }, addresses: { doge: "DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L" } } });
assert.equal(r.data.transactions.length, 1);
await send(eth, AGENT, r.data.transactions[0]);
r = await call("resolve", { query: name });
assert.equal(r.data.text.url, "https://botnames.dev");
assert.equal(r.data.addresses.doge, "DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L");
step("set_records: stranger refused; owner's url + DOGE written");

const files = [
  { path: "index.html", content: `<!doctype html><meta charset=utf-8><title>${name}</title><link rel=stylesheet href=style.css><h1>${name}</h1><p>Bot Names e2e test.</p>` },
  { path: "style.css", content: "body{font-family:system-ui;background:#0b0c0a;color:#c8f53c}" },
];
r = await call("deploy_site", { name, files });
assert.ok(r.isError);
const payTx = r.data.payment_transaction;
assert.equal(payTx.chain_id, 8453);
step("deploy_site unpaid: returns the USDC payment transaction");

// A stranger pays: refused, and the payment is NOT consumed
const strangerHash = await send(bas, STRANGER, payTx);
r = await call("deploy_site", { name, files, payment_tx: strangerHash });
assert.ok(r.isError && /not .*owner/.test(r.data.error), JSON.stringify(r.data));
step("deploy_site paid by a stranger: refused");

const payHash = await send(bas, AGENT, payTx);
r = await call("deploy_site", { name, files, payment_tx: payHash });
assert.ok(!r.isError, JSON.stringify(r.data));
const cid = r.data.cid;
step(`deploy_site: pinned ${cid}`);
for (const t of r.data.transactions) await send(eth, AGENT, t);
r = await call("resolve", { query: name });
assert.equal(r.data.contenthash, `ipfs://${cid}`);
assert.equal(r.data.website, `https://${name}.limo`);
step("contenthash set: resolve shows the site");

r = await call("deploy_site", { name, files, payment_tx: payHash });
assert.ok(r.isError && /already used/.test(r.data.error));
step("payment replay: refused");

r = await call("deploy_site", { name, files: [{ path: "index.html", content: '<form><input type="password"></form>' }] });
assert.ok(r.isError && /password/.test(r.data.error));
step("phishing-shaped page: refused before payment");

// A v1 name with no resolver: set_records must set one first
r = await call("set_records", { name: "klumpai", records: { text: { description: "hi" } } });
const klumpOwner = r.data.owner;
assert.equal(r.data.transactions.length, 2, JSON.stringify(r.data));
await eth.impersonateAccount({ address: klumpOwner });
await eth.setBalance({ address: klumpOwner, value: 10n ** 18n });
for (const t of r.data.transactions) await send(eth, klumpOwner, t);
assert.equal((await call("resolve", { query: "klumpai.ai-bot.eth" })).data.text.description, "hi");
step("v1 name without a resolver: setResolver + records, in order");

r = await call("resolve", { query: "vitalik.eth" });
assert.match(r.data.addresses.ethereum, /^0x/);
r = await call("resolve", { query: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" });
assert.equal(r.data.primary_name, "vitalik.eth");
step("resolve works for any ENS name and for addresses");

r = await call("list_names", { owner: "0x0104c88Ea4f55c26df89F5cd3eC62F3C8288D69b" });
assert.ok(r.data.names.some((n) => n.name === "abc.ai-bot.eth"), JSON.stringify(r.data));
step(`list_names: ${r.data.names.map((n) => n.name).join(", ")}`);

console.log(`\nE2E OK (${name}, site ${cid})`);
await client.close();
