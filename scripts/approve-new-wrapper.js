const hre = require("hardhat");

async function main() {
  const nameWrapper = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  const newContractAddress = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89";
  
  console.log("Setting approval for NEW wrapper contract...");
  console.log("Contract:", newContractAddress);
  
  const wrapperAbi = [
    "function setApprovalForAll(address operator, bool approved) external"
  ];
  
  const wrapper = await hre.ethers.getContractAt(wrapperAbi, nameWrapper);
  
  const tx = await wrapper.setApprovalForAll(newContractAddress, true);
  console.log("TX hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ NEW contract approved!");
  console.log("\nReady to test registration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
