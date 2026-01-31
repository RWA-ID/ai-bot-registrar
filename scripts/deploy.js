import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying AIBotSubdomainRegistrar...");

  // ENS Registry on Ethereum Mainnet
  const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  
  // ENS Public Resolver on Ethereum Mainnet
  const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";
  
  // Namehash for ai-bot.eth
  const ROOT_NODE = ethers.namehash("ai-bot.eth");
  
  // Registration price: 0.001 ETH (~$3-4)
  const REGISTRATION_PRICE = ethers.parseEther("0.001");

  const AIBotSubdomainRegistrar = await ethers.getContractFactory("AIBotSubdomainRegistrar");
  const registrar = await AIBotSubdomainRegistrar.deploy(
    ENS_REGISTRY,
    PUBLIC_RESOLVER,
    ROOT_NODE,
    REGISTRATION_PRICE
  );

  await registrar.waitForDeployment();
  const address = await registrar.getAddress();

  console.log("\n✅ AIBotSubdomainRegistrar deployed to:", address);
  console.log("Root node (ai-bot.eth):", ROOT_NODE);
  console.log("Registration price:", ethers.formatEther(REGISTRATION_PRICE), "ETH");
  
  // Display contract info
  const info = await registrar.getContractInfo();
  console.log("\n📋 Contract Info:");
  console.log("- ENS Registry:", info.ensRegistry);
  console.log("- Public Resolver:", info.resolver);
  console.log("- Root Node:", info.rootNodeHash);
  console.log("- Price:", ethers.formatEther(info.price), "ETH");
  console.log("- Owner:", info.contractOwner);
  
  console.log("\n🤖 Agents can now:");
  console.log("1. Register subdomains by calling registerSubdomain(name)");
  console.log("2. Automatically get a resolver set up");
  console.log("3. Set records using ENS apps or directly via resolver");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
