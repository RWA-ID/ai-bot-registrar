const hre = require("hardhat");

async function main() {
  const registrarAddress = "0xAD613d8E93B206dB1824D21Fd9F9C7011bcE7229";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with account:", signer.address);
  
  const registrar = await hre.ethers.getContractAt(
    "AIBotSubdomainRegistrar",
    registrarAddress
  );
  
  const subdomain = "simple-test";
  console.log(`\nChecking "${subdomain}"...`);
  const available = await registrar.isSubdomainAvailable(subdomain);
  console.log("Available:", available);
  
  if (!available) {
    console.log("Already taken, trying different name...");
    const timestamp = Date.now().toString().slice(-6);
    subdomain = `test${timestamp}`;
  }
  
  const price = await registrar.registrationPrice();
  console.log("Price:", hre.ethers.formatEther(price), "ETH");
  
  console.log(`\nAttempting to register "${subdomain}.ai-bot.eth"...`);
  
  try {
    // Try with more gas
    const tx = await registrar.registerSubdomain(subdomain, {
      value: price,
      gasLimit: 500000
    });
    
    console.log("TX hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Success! Gas used:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Try to get more details
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
