const hre = require("hardhat");

async function main() {
  const registrarAddress = "0x16c92E4703bD40d9cfd7B4144389E49d5A453948";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing automatic resolver setup...");
  console.log("Account:", signer.address);
  
  const registrar = await hre.ethers.getContractAt(
    "AIBotSubdomainRegistrar",
    registrarAddress
  );
  
  const subdomain = "test-" + Date.now().toString().slice(-6);
  console.log(`\n🤖 Registering: ${subdomain}.ai-bot.eth`);
  
  const price = await registrar.registrationPrice();
  
  const tx = await registrar.registerSubdomain(subdomain, {
    value: price
  });
  
  console.log("TX hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("\n✅ SUCCESS! Registration confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check if resolver was set
    const ensRegistry = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    const ensAbi = [
      "function resolver(bytes32 node) external view returns (address)"
    ];
    const ens = await hre.ethers.getContractAt(ensAbi, ensRegistry);
    
    const fullName = subdomain + ".ai-bot.eth";
    const namehash = hre.ethers.namehash(fullName);
    const resolverAddress = await ens.resolver(namehash);
    
    console.log("\n📋 Resolver Check:");
    console.log("Expected:", "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63");
    console.log("Actual:  ", resolverAddress);
    
    if (resolverAddress === "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63") {
      console.log("✅ Resolver automatically set!");
    } else {
      console.log("❌ Resolver not set");
    }
    
    console.log(`\n🎉 Your subdomain: ${subdomain}.ai-bot.eth`);
    console.log("View: https://sepolia.app.ens.domains/" + fullName);
  } else {
    console.log("❌ Transaction failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
