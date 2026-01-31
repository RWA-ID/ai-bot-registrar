const hre = require("hardhat");

async function main() {
  const registrarAddress = "0x53b7b9F8836E86791C4Bf324adc1773A9744dCAd";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with account:", signer.address);
  
  const registrar = await hre.ethers.getContractAt(
    "AIBotSubdomainRegistrar",
    registrarAddress
  );
  
  const subdomain = "test-agent-" + Date.now().toString().slice(-4);
  console.log(`\nAttempting to register: ${subdomain}.ai-bot.eth`);
  
  const price = await registrar.registrationPrice();
  console.log("Price:", hre.ethers.formatEther(price), "ETH");
  
  const tx = await registrar.registerSubdomain(subdomain, {
    value: price,
    gasLimit: 300000
  });
  
  console.log("TX hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Registration successful!");
  console.log("Gas used:", receipt.gasUsed.toString());
  
  // Check the event
  const event = receipt.logs.find(log => {
    try {
      return registrar.interface.parseLog(log).name === "SubdomainRegistered";
    } catch(e) {
      return false;
    }
  });
  
  if (event) {
    const parsed = registrar.interface.parseLog(event);
    console.log("\n📡 Event Details:");
    console.log("- Subdomain:", parsed.args.subdomain);
    console.log("- Owner:", parsed.args.owner);
    console.log("- Subnode:", parsed.args.subnode);
  }
  
  console.log(`\n🎉 Successfully registered: ${subdomain}.ai-bot.eth`);
  console.log("\nYou can now set records on this subdomain using ENS manager app!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
