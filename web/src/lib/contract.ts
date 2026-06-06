export const REGISTRAR_ADDRESS = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89" as const;
export const NAME_WRAPPER_ADDRESS = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401" as const;
export const REGISTRATION_FEE = BigInt("1000000000000000"); // 0.001 ETH
export const PARENT_DOMAIN = "ai-bot.eth";

export const NAME_WRAPPER_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Compute the subnode hash for a subdomain under ai-bot.eth
// Must match: keccak256(abi.encodePacked(rootNode, keccak256(bytes(subdomain))))
import { namehash, keccak256, encodePacked, toBytes } from "viem";

export const ROOT_NODE = namehash("ai-bot.eth") as `0x${string}`;

export function getSubnodeHash(subdomain: string): bigint {
  const labelHash = keccak256(toBytes(subdomain));
  const subnodeHex = keccak256(encodePacked(["bytes32", "bytes32"], [ROOT_NODE, labelHash]));
  return BigInt(subnodeHex);
}

export const ABI = [
  {
    inputs: [{ internalType: "string", name: "subdomain", type: "string" }],
    name: "registerSubdomain",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "subdomain", type: "string" }],
    name: "isSubdomainAvailable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "agent", type: "address" }],
    name: "getAgentSubdomains",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "registrationPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "subdomain", type: "string" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "bytes32", name: "label", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "subnode", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "SubdomainRegistered",
    type: "event",
  },
] as const;
