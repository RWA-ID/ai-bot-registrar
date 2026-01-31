const hre = require("hardhat");

async function main() {
  const registrarAddress = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("🚀 MAINNET Registration Test");
  console.log("Account:", signer.address);
  
  const registrar = await hre.ethers.getContractAt(
    "AIBotSubdomainRegistrarWrapper",
    registrarAddress
  );
  
  // Use a simple name without special characters
  const subdomain = "firstagent";
  console.log(`\n🤖 Registering: ${subdomain}.ai-bot.eth`);
  
  const price = await registrar.registrationPrice();
  console.log("Price:", hre.ethers.formatEther(price), "ETH");
  
  // Check availability first
  const available = await registrar.isSubdomainAvailable(subdomain);
  if (!available) {
    console.log("❌ Subdomain already taken!");
    return;
  }
  console.log("✅ Subdomain available!");
  
  console.log("\nSending transaction...");
  const tx = await registrar.registerSubdomain(subdomain, {
    value: price
  });
  
  console.log("TX hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("\n🎉🎉🎉 SUCCESS! 🎉🎉🎉");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log(`\n✅ Registered: ${subdomain}.ai-bot.eth`);
    console.log("\n🌐 View on ENS:");
    console.log("https://app.ens.domains/" + subdomain + ".ai-bot.eth");
    console.log("\n📊 View transaction:");
    console.log("https://etherscan.io/tx/" + tx.hash);
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
