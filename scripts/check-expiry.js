const hre = require("hardhat");

async function main() {
  const nameWrapper = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  const tokenId = hre.ethers.namehash("ai-bot.eth");
  
  const wrapperAbi = [
    "function getData(uint256 tokenId) external view returns (address owner, uint32 fuses, uint64 expiry)"
  ];
  
  const wrapper = await hre.ethers.getContractAt(wrapperAbi, nameWrapper);
  const data = await wrapper.getData(tokenId);
  
  console.log("ai-bot.eth wrapped data:");
  console.log("Owner:", data.owner);
  console.log("Fuses:", data.fuses);
  console.log("Expiry:", data.expiry.toString());
  console.log("Expiry date:", new Date(Number(data.expiry) * 1000).toISOString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
