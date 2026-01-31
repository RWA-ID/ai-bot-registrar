const hre = require("hardhat");

async function main() {
  const registrarAddress = "0x53b7b9F8836E86791C4Bf324adc1773A9744dCAd";
  const ensRegistry = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const rootNode = "0x55e604f9c8325713b8f2e3fcd37d1599d1c99aada9465cfacbd51264d19bd5f8"; // ai-bot.eth
  
  console.log("Checking ENS permissions...\n");
  
  // Connect to ENS Registry
  const ensAbi = [
    "function owner(bytes32 node) external view returns (address)"
  ];
  const ens = await hre.ethers.getContractAt(ensAbi, ensRegistry);
  
  // Check who owns ai-bot.eth
  const owner = await ens.owner(rootNode);
  console.log("ai-bot.eth owner on ENS:", owner);
  console.log("New contract address:", registrarAddress);
  console.log("Match:", owner.toLowerCase() === registrarAddress.toLowerCase());
  
  if (owner.toLowerCase() !== registrarAddress.toLowerCase()) {
    console.log("\n❌ Problem: Contract doesn't own the ENS domain!");
    console.log("You need to transfer ai-bot.eth to:", registrarAddress);
  } else {
    console.log("\n✅ Contract owns the domain");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
