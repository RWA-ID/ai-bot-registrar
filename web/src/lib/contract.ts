import { namehash, keccak256, encodePacked, toBytes, encodeFunctionData, parseAbi } from "viem";

// BotNamesRegistrar: one-tx register + records, names minted with PARENT_CANNOT_CONTROL.
export const REGISTRAR_ADDRESS = "0x52bf7D9A2F50ED9707c573FEAC708716E49B4275" as const;
// The first registrar. Its NameWrapper approval is revoked; read only for names it minted.
export const V1_REGISTRAR_ADDRESS = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89" as const;
export const NAME_WRAPPER_ADDRESS = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401" as const;
export const PUBLIC_RESOLVER_ADDRESS = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as const;
export const REGISTRATION_FEE = BigInt("1000000000000000"); // 0.001 ETH, fallback when fee() can't be read
export const PARENT_DOMAIN = "ai-bot.eth";

export const ROOT_NODE = namehash("ai-bot.eth") as `0x${string}`;

// Must match: keccak256(abi.encodePacked(rootNode, keccak256(bytes(label))))
export function getSubnodeHash(label: string): bigint {
  const labelHash = keccak256(toBytes(label));
  return BigInt(keccak256(encodePacked(["bytes32", "bytes32"], [ROOT_NODE, labelHash])));
}

/** Same rule as BotNamesRegistrar.validLabel: a-z 0-9 -, 3-63 chars, no edge hyphen, no "--" at 3-4. */
export function isValidLabel(label: string) {
  return (
    label.length >= 3 &&
    label.length <= 63 &&
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(label) &&
    label.slice(2, 4) !== "--"
  );
}

export const ABI = parseAbi([
  "function register(string label, address owner, bytes[] records) payable returns (bytes32)",
  "function available(string label) view returns (bool)",
  "function validLabel(string label) pure returns (bool)",
  "function fee() view returns (uint256)",
  "event NameRegistered(string label, bytes32 indexed labelhash, bytes32 node, address indexed owner, address indexed payer, uint256 fee)",
]);

export const V1_ABI = parseAbi([
  "function getAgentSubdomains(address agent) view returns (string[])",
  "event SubdomainRegistered(string subdomain, address indexed owner, bytes32 indexed label, bytes32 subnode, uint256 price, uint256 timestamp)",
]);

export const NAME_WRAPPER_ABI = parseAbi([
  "function ownerOf(uint256 id) view returns (address)",
]);

const RESOLVER_ABI = parseAbi([
  "function setAddr(bytes32 node, address a)",
  "function setAddr(bytes32 node, uint256 coinType, bytes a)",
]);

const COIN_TYPE_BASE = 2147492101n; // ENSIP-11: 0x80000000 | 8453

/** Records written at mint: the owner's wallet as its Ethereum and Base address. */
export function mintRecords(label: string, owner: `0x${string}`): `0x${string}`[] {
  const node = namehash(`${label}.${PARENT_DOMAIN}`);
  return [
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: "setAddr", args: [node, owner] }),
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: "setAddr", args: [node, COIN_TYPE_BASE, owner] }),
  ];
}
