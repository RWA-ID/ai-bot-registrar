import pkg from "hardhat";
const { ethers } = pkg;

/**
 * Example: How an AI agent would interact with the registrar
 */
async function main() {
  console.log("🤖 AI Agent Registration Example\n");

  // Get signer (in real scenario, this would be the agent's wallet)
  const [agent] = await ethers.getSigners();
  console.log("Agent address:", agent.address);

  // Contract address (will be set after deployment)
  const REGISTRAR_ADDRESS = process.env.REGISTRAR_ADDRESS || "0x...";
  
  if (REGISTRAR_ADDRESS === "0x...") {
    console.log("\n⚠️  Please set REGISTRAR_ADDRESS environment variable");
    console.log("Example: REGISTRAR_ADDRESS=0x... npx hardhat run scripts/agent-example.js");
    return;
  }

  // Load contract
  const registrar = await ethers.getContractAt(
    "AIBotSubdomainRegistrar",
    REGISTRAR_ADDRESS
  );

  // Step 1: Get contract info
  console.log("\n📋 Contract Information:");
  const info = await registrar.getContractInfo();
  console.log("- Registration Price:", ethers.formatEther(info.price), "ETH");
  console.log("- ENS Registry:", info.ensRegistry);
  console.log("- Public Resolver:", info.resolver);

  // Step 2: Check subdomain availability
  const desiredName = "demo-agent";
  console.log(`\n🔍 Checking availability of "${desiredName}"...`);
  const available = await registrar.isSubdomainAvailable(desiredName);
  
  if (!available) {
    console.log(`❌ "${desiredName}" is already taken`);
    return;
  }
  console.log(`✅ "${desiredName}" is available!`);

  // Step 3: Register subdomain
  console.log(`\n📝 Registering "${desiredName}.ai-bot.eth"...`);
  const tx = await registrar.registerSubdomain(desiredName, {
    value: info.price
  });
  
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Registration confirmed!");
  
  // Find the SubdomainRegistered event
  const event = receipt.logs.find(
    log => log.fragment && log.fragment.name === "SubdomainRegistered"
  );
  
  if (event) {
    console.log("\n📡 Registration Event:");
    console.log("- Subdomain:", event.args.subdomain);
    console.log("- Owner:", event.args.owner);
    console.log("- Subnode Hash:", event.args.subnode);
    console.log("- Timestamp:", new Date(Number(event.args.timestamp) * 1000).toISOString());
  }

  // Step 4: Verify registration
  console.log("\n✅ Verification:");
  const mySubdomains = await registrar.getAgentSubdomains(agent.address);
  console.log("My registered subdomains:", mySubdomains);
  
  const subnodeHash = await registrar.getSubnodeHash(desiredName);
  console.log("Subnode hash for ENS lookups:", subnodeHash);

  console.log("\n🎉 Registration Complete!");
  console.log(`\nYour ENS name: ${desiredName}.ai-bot.eth`);
  console.log("\nNext steps:");
  console.log("1. Set your avatar using the ENS Public Resolver");
  console.log("2. Add text records (description, url, etc.)");
  console.log("3. Link to your ERC-8004 identity");
  console.log("4. Start using your decentralized agent identity!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
