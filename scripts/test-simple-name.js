const hre = require("hardhat");

async function main() {
  const registrarAddress = "0x16c92E4703bD40d9cfd7B4144389E49d5A453948";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with simple name (no hyphens)...");
  
  const registrar = await hre.ethers.getContractAt(
    "AIBotSubdomainRegistrar",
    registrarAddress
  );
  
  // Simple name without hyphens
  const subdomain = "testagent" + Date.now().toString().slice(-4);
  console.log(`\n🤖 Registering: ${subdomain}.ai-bot.eth`);
  
  const price = await registrar.registrationPrice();
  
  const tx = await registrar.registerSubdomain(subdomain, {
    value: price
  });
  
  console.log("TX hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("\n✅ SUCCESS!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check resolver
    const ensRegistry = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    const ensAbi = [
      "function owner(bytes32 node) external view returns (address)",
      "function resolver(bytes32 node) external view returns (address)"
    ];
    const ens = await hre.ethers.getContractAt(ensAbi, ensRegistry);
    
    const fullName = subdomain + ".ai-bot.eth";
    const namehash = hre.ethers.namehash(fullName);
    
    const owner = await ens.owner(namehash);
    const resolverAddr = await ens.resolver(namehash);
    
    console.log("\n📋 Registration Details:");
    console.log("Name:", fullName);
    console.log("Owner:", owner);
    console.log("Resolver:", resolverAddr);
    console.log("Resolver correct:", resolverAddr === "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" ? "✅" : "❌");
    
    console.log(`\n🎉 Check on ENS Manager:`);
    console.log("https://sepolia.app.ens.domains/" + fullName);
    console.log("\nIf this shows correctly without hash, we're ready for mainnet!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
