import { test } from "node:test";
import assert from "node:assert/strict";
import { namehash, zeroAddress, type PublicClient } from "viem";
import { ENS_REGISTRY, PUBLIC_RESOLVER } from "../src/config.ts";
import { findOwnResolver, lookupName } from "../src/chain.ts";

const OLD_RESOLVER = "0xF29100983E058B709F3D539b0c765937B804AC15";
const ENSV1_RESOLVER = "0x394D8EB4a4fDF599384DeAb25F31d111d755c398";
const CONTENTHASH = `0xe30101701220${"00".repeat(32)}`; // ipfs, dag-pb, sha2-256

/** A client whose ENS registry holds `resolvers`; the post-ENSv2 lookups (findResolver, getEnsResolver) answer ENSV1Resolver. */
function fakeClient(resolvers: Record<string, string>) {
  const calls: { address: string; functionName: string }[] = [];
  const client = {
    async readContract({ address, functionName, args }: { address: string; functionName: string; args: unknown[] }) {
      calls.push({ address, functionName });
      if (address === ENS_REGISTRY && functionName === "resolver") return resolvers[args[0] as string] ?? zeroAddress;
      if (functionName === "contenthash") {
        if (address === ENSV1_RESOLVER) throw new Error('The contract function "contenthash" reverted.');
        return CONTENTHASH;
      }
      throw new Error(`unexpected call ${functionName} on ${address}`);
    },
    getEnsResolver: async () => ENSV1_RESOLVER,
    getEnsAddress: async () => null,
    getEnsText: async () => null,
  };
  return { client: client as unknown as PublicClient, calls };
}

test("findOwnResolver reads the name's own resolver from the ENS registry", async () => {
  const { client, calls } = fakeClient({ [namehash("drhiro.ai-bot.eth")]: OLD_RESOLVER });
  assert.equal(await findOwnResolver(client, "drhiro.ai-bot.eth"), OLD_RESOLVER);
  assert.deepEqual(calls, [{ address: ENS_REGISTRY, functionName: "resolver" }]);
});

test("findOwnResolver returns null for a name with no resolver (first-registrar names)", async () => {
  const { client } = fakeClient({ [namehash("ai-bot.eth")]: PUBLIC_RESOLVER });
  assert.equal(await findOwnResolver(client, "joe.ai-bot.eth"), null);
});

test("lookupName reads contenthash from the registry's resolver, not ENSV1Resolver", async () => {
  const { client } = fakeClient({ [namehash("claude.ai-bot.eth")]: PUBLIC_RESOLVER });
  const out = await lookupName(client, "claude.ai-bot.eth");
  assert.equal(out.errors.contenthash, undefined);
  assert.match(out.contenthash ?? "", /^ipfs:\/\//);
});

test("lookupName reports no contenthash for a name with no resolver", async () => {
  const { client } = fakeClient({});
  const out = await lookupName(client, "joe.ai-bot.eth");
  assert.equal(out.contenthash, null);
  assert.equal(out.errors.contenthash, undefined);
});
