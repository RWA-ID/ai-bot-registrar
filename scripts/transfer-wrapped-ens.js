const hre = require("hardhat");

async function main() {
  const nameWrapper = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  const contractAddress = "0xe8C3fCd248F3333Ce059f8e2f478A77b68221aEb";
  const tokenId = hre.ethers.namehash("ai-bot.eth");
  
  console.log("Transferring wrapped ai-bot.eth to contract...");
  
  const wrapperAbi = [
    "function safeTransferFrom(address from, address to, uint256 tokenId) external"
  ];
  
  const wrapper = await hre.ethers.getContractAt(wrapperAbi, nameWrapper);
  const [signer] = await hre.ethers.getSigners();
  
  console.log("From:", signer.address);
  console.log("To:", contractAddress);
  
  const tx = await wrapper.safeTransferFrom(signer.address, contractAddress, tokenId);
  console.log("TX hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Transfer complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
