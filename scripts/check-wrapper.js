const hre = require("hardhat");

async function main() {
  const nameWrapper = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  const rootNode = hre.ethers.namehash("ai-bot.eth");
  
  console.log("Checking Name Wrapper status...");
  
  const wrapperAbi = [
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function setSubnodeOwner(bytes32 parentNode, string calldata label, address owner, uint32 fuses, uint64 expiry) external returns (bytes32)"
  ];
  
  const wrapper = await hre.ethers.getContractAt(wrapperAbi, nameWrapper);
  
  // ENS uses namehash as tokenId for wrapped names
  const tokenId = rootNode;
  
  try {
    const owner = await wrapper.ownerOf(tokenId);
    console.log("Wrapped token owner:", owner);
    
    const [signer] = await hre.ethers.getSigners();
    console.log("Your address:", signer.address);
    
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      console.log("\n✅ You own the wrapped ai-bot.eth!");
      console.log("\nOptions:");
      console.log("1. Unwrap the name via app.ens.domains");
      console.log("2. Or we can work with the wrapper (more complex)");
    } else {
      console.log("\n❌ You don't own the wrapped token");
      console.log("Owner is:", owner);
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
