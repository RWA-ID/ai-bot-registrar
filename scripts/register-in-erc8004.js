const hre = require("hardhat");

async function main() {
  // ERC-8004 Identity Registry on Ethereum Mainnet
  const IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
  
  // Your registration file URI on GitHub
  const AGENT_URI = "https://raw.githubusercontent.com/RWA-ID/ai-bot-registrar/main/erc8004-registration.json";
  
  console.log("🤖 Registering AI Bot ENS Registrar in ERC-8004");
  console.log("Identity Registry:", IDENTITY_REGISTRY);
  console.log("Agent URI:", AGENT_URI);
  
  const registryABI = [
    "function register(string memory agentURI) external returns (uint256 agentId)",
    "function tokenURI(uint256 tokenId) external view returns (string memory)",
    "function ownerOf(uint256 tokenId) external view returns (address)"
  ];
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Registering from:", signer.address);
  
  const registry = new hre.ethers.Contract(
    IDENTITY_REGISTRY,
    registryABI,
    signer
  );
  
  console.log("\nCalling register()...");
  const tx = await registry.register(AGENT_URI);
  console.log("TX hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Registration confirmed!");
  
  // Find the Registered event to get your agentId
  const registerEvent = receipt.logs.find(log => {
    try {
      const parsed = registry.interface.parseLog(log);
      return parsed && parsed.name === "Registered";
    } catch(e) {
      return false;
    }
  });
  
  if (registerEvent) {
    const parsed = registry.interface.parseLog(registerEvent);
    const agentId = parsed.args.agentId;
    
    console.log("\n🎉 SUCCESS!");
    console.log("Your Agent ID:", agentId.toString());
    console.log("\nYour Global Agent Registry:");
    console.log(`eip155:1:${IDENTITY_REGISTRY}:${agentId}`);
    console.log("\nView on 8004scan.io:");
    console.log(`https://8004scan.io/agent/${agentId}`);
    console.log("\nEtherscan:");
    console.log(`https://etherscan.io/tx/${tx.hash}`);
    
    return agentId.toString();
  } else {
    console.log("\n⚠️ Could not find Registered event in receipt");
  }
}

main()
  .then((agentId) => {
    if (agentId) {
      console.log("\n📝 Next steps:");
      console.log("1. Update erc8004-registration.json with your agentId in registrations array");
      console.log("2. Push updated file to GitHub");
      console.log("3. Your service is now discoverable on 8004scan.io!");
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
