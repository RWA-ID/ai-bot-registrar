const hre = require("hardhat");

async function main() {
  const nameWrapper = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  const contractAddress = "0xe8C3fCd248F3333Ce059f8e2f478A77b68221aEb";
  
  console.log("Setting approval for contract to manage ai-bot.eth...");
  
  const wrapperAbi = [
    "function setApprovalForAll(address operator, bool approved) external"
  ];
  
  const wrapper = await hre.ethers.getContractAt(wrapperAbi, nameWrapper);
  
  const tx = await wrapper.setApprovalForAll(contractAddress, true);
  console.log("TX hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Contract approved as operator!");
  console.log("\nThe contract can now create subdomains under ai-bot.eth");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
