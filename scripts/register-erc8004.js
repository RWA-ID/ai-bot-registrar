const hre = require("hardhat");

async function main() {
// ERC-8004 Identity Registry addresses (these may vary)
// You'll need to check 8004.org for the official registry

console.log("🔍 Checking ERC-8004 Registration Status");
console.log("\nYour Service Details:");
console.log("- Name: AI Bot ENS Subdomain Registrar");
console.log("- Contract: 0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89");
console.log("- Network: Ethereum Mainnet");

console.log("\n⚠️ You need to:");
console.log("1. Host your erc8004-registration.json file (IPFS or GitHub)");
console.log("2. Get the ERC-8004 Identity Registry address from 8004.org");
console.log("3. Call register() on the Identity Registry");

console.log("\n📍 Let me search for the official registry...");
}

main()
.then(() => process.exit(0))
.catch((error) => {
console.error(error);
process.exit(1);
});
