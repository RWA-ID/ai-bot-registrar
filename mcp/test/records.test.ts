import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFunctionData, namehash, type Hex } from "viem";
import { RESOLVER_ABI } from "../src/config.ts";
import { encodeRecords, encodeContenthashValue, EVM_CHAINS, RecordError } from "../src/records.ts";

const node = namehash("mybot.ai-bot.eth");
const OWNER = "0x5f11a48230f7CdaB91A2361576239091E4b1165b";
const decode = (data: Hex) => decodeFunctionData({ abi: RESOLVER_ABI, data });

test("ethereum uses setAddr(node, address); other chains use ENSIP-11 coin types", () => {
  const { calls, writes } = encodeRecords(node, { addresses: { eth: OWNER, base: OWNER, arbitrum: OWNER, "evm:999": OWNER } });
  assert.equal(calls.length, 4);
  const [eth, ...rest] = calls.map(decode);
  assert.equal(eth.functionName, "setAddr");
  assert.deepEqual(eth.args, [node, OWNER]);
  assert.deepEqual(rest.map((c) => c.args?.[1]), [0x80000000n | 8453n, 0x80000000n | 42161n, 0x80000000n | 999n]);
  assert.equal(rest[0].args?.[2], OWNER.toLowerCase());
  assert.deepEqual(writes.map((w) => w.record), ["address:ethereum", "address:base", "address:arbitrum", "address:evm chain 999"]);
});

test("btc and sol decode to their ENSIP-9 bytes", () => {
  const { calls } = encodeRecords(node, {
    addresses: { bitcoin: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", solana: "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1" },
  });
  const [btc, sol] = calls.map(decode);
  assert.deepEqual(btc.args?.slice(1), [0n, "0x0014751e76e8199196d454941c45d1b3a323f1433bd6"]);
  assert.deepEqual(sol.args?.slice(1), [501n, "0xacf136eb01fc1c4e883d23c8b5844ab59a37f66add57c5e9ac3b53e059d35c64"]);
});

test('"evm" writes every listed chain plus the ENSIP-19 default', () => {
  const { calls } = encodeRecords(node, { addresses: { evm: OWNER } });
  assert.equal(calls.length, Object.keys(EVM_CHAINS).length + 1);
  const coinTypes = calls.map((c) => decode(c).args?.[1]);
  assert.ok(coinTypes.includes(0x80000000n));
});

test('"evm" plus an explicit chain with the same address dedupes; a different one is an error', () => {
  assert.equal(encodeRecords(node, { addresses: { evm: OWNER, base: OWNER } }).calls.length, Object.keys(EVM_CHAINS).length + 1);
  assert.throws(
    () => encodeRecords(node, { addresses: { evm: OWNER, base: "0x000000000000000000000000000000000000dEaD" } }),
    RecordError
  );
});

test("bad addresses and unknown coins are rejected with a clear message", () => {
  assert.throws(() => encodeRecords(node, { addresses: { btc: "bc1qnotvalid" } }), /not a valid BTC address/);
  assert.throws(() => encodeRecords(node, { addresses: { base: "0x123" } }), /not an EVM address/);
  assert.throws(() => encodeRecords(node, { addresses: { notacoin: "x" } }), /unknown coin or chain/);
});

test("empty values clear records", () => {
  const { calls } = encodeRecords(node, { addresses: { btc: "", base: "" }, text: { url: "" }, contenthash: "" });
  const [btc, b, url, ch] = calls.map(decode);
  assert.equal(btc.args?.[2], "0x");
  assert.equal(b.args?.[2], "0x");
  assert.deepEqual(url.args, [node, "url", ""]);
  assert.deepEqual(ch.args, [node, "0x"]);
});

test("text and contenthash", () => {
  const { calls } = encodeRecords(node, {
    text: { avatar: "ipfs://bafkreig4ld75lloteqz2iwti2qskmshw7ckkujjcwfhhpjewzaug2dfncq", "com.twitter": "botnameservice" },
    contenthash: "ipfs://bafybeiei5qc5ujuryjhne32uhhpwnlaqqakpa74ysl7b2g7mseibi3ouqm",
  });
  assert.equal(decode(calls[0]).functionName, "setText");
  const ch = decode(calls[2]);
  assert.equal(ch.functionName, "setContenthash");
  assert.match(ch.args?.[1] as string, /^0xe30101701220/);
});

test("contenthash input validation", () => {
  assert.match(encodeContenthashValue("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4"), /^0xe301/);
  assert.throws(() => encodeContenthashValue("https://example.com"), RecordError);
  assert.throws(() => encodeContenthashValue("ipfs://not-a-cid"), RecordError);
  assert.throws(() => encodeRecords(node, { text: { "bad key!": "x" } }), RecordError);
});

test("record count is capped", () => {
  const text = Object.fromEntries(Array.from({ length: 41 }, (_, i) => [`k${i}`, "v"]));
  assert.throws(() => encodeRecords(node, { text }), /limit is 40/);
});

test("defaults fill only coin types the caller left unset", () => {
  const other = "0x000000000000000000000000000000000000dEaD";
  const { writes } = encodeRecords(node, { addresses: { eth: other, btc: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4" } }, { ethereum: OWNER, base: OWNER });
  assert.deepEqual(writes.map((w) => [w.record, w.value]), [
    ["address:ethereum", other],
    ["address:btc", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"],
    ["address:base", OWNER],
  ]);
  assert.equal(encodeRecords(node, { addresses: { evm: other } }, { ethereum: OWNER, base: OWNER }).writes.length, Object.keys(EVM_CHAINS).length + 1);
});

test("ENSIP-11 AVAX exception: avax is the X-chain (9000), avalanche/avaxc the C-chain", () => {
  const c = decode(encodeRecords(node, { addresses: { avaxc: OWNER } }).calls[0]);
  assert.equal(c.args?.[1], 0x80000000n | 43114n);
  assert.throws(() => encodeRecords(node, { addresses: { avax: OWNER } }), /not a valid AVAX address/);
});
