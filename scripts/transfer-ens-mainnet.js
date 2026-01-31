const hre = require("hardhat");

async function main() {
  const ensRegistry = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const rootNode = "0x55e604f9c8325713b8f2e3fcd37d1599d1c99aada9465cfacbd51264d19bd5f8"; // ai-bot.eth
  const contractAddress = "0xe8C3fCd248F3333Ce059f8e2f478A77b68221aEb";
  
  console.log("Transferring ai-bot.eth control to contract...");
  console.log("Contract address:", contractAddress);
  
  const ensAbi = [
    "function owner(bytes32 node) external view returns (address)",
    "function setOwner(bytes32 node, address owner) external"
  ];
  
  const ens = await hre.ethers.getContractAt(ensAbi, ensRegistry);
  
  // Check current owner
  const currentOwner = await ens.owner(rootNode);
  console.log("\nCurrent owner:", currentOwner);
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Your address:", signer.address);
  
  if (currentOwner.toLowerCase() === contractAddress.toLowerCase()) {
    console.log("✅ Contract already owns ai-bot.eth!");
    return;
  }
  
  console.log("\nTransferring ownership...");
  const tx = await ens.setOwner(rootNode, contractAddress);
  console.log("TX hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Transfer complete!");
  
  // Verify
  const newOwner = await ens.owner(rootNode);
  console.log("New owner:", newOwner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
