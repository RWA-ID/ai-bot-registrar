const hre = require("hardhat");

async function main() {
  const registrarAddress = "0x485a4C75046Aa579a1ca710C1e4dB72776eA9361";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with account:", signer.address);
  
  const registrar = await hre.ethers.getContractAt(
    "AIBotSubdomainRegistrar",
    registrarAddress
  );
  
  const subdomain = "agent-" + Date.now().toString().slice(-6);
  console.log(`\n🤖 Registering: ${subdomain}.ai-bot.eth`);
  
  const price = await registrar.registrationPrice();
  console.log("Price:", hre.ethers.formatEther(price), "ETH");
  
  const tx = await registrar.registerSubdomain(subdomain, {
    value: price
  });
  
  console.log("TX hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("\n✅ SUCCESS! Registration confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log(`\n🎉 You now own: ${subdomain}.ai-bot.eth`);
    console.log("\nView on Sepolia ENS: https://sepolia.app.ens.domains/" + subdomain + ".ai-bot.eth");
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
