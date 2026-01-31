import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying AIBotSubdomainRegistrarWrapper for wrapped ENS...");

  // Name Wrapper on Ethereum Mainnet
  const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  
  // ENS Public Resolver on Ethereum Mainnet
  const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";
  
  // Namehash for ai-bot.eth
  const ROOT_NODE = ethers.namehash("ai-bot.eth");
  
  // Registration price: 0.001 ETH
  const REGISTRATION_PRICE = ethers.parseEther("0.001");
  
  // Parent expiry (December 1, 2027)
  const PARENT_EXPIRY = "1827698789";

  const AIBotSubdomainRegistrarWrapper = await ethers.getContractFactory("AIBotSubdomainRegistrarWrapper");
  const registrar = await AIBotSubdomainRegistrarWrapper.deploy(
    NAME_WRAPPER,
    PUBLIC_RESOLVER,
    ROOT_NODE,
    REGISTRATION_PRICE,
    PARENT_EXPIRY
  );

  await registrar.waitForDeployment();
  const address = await registrar.getAddress();

  console.log("\n✅ AIBotSubdomainRegistrarWrapper deployed to:", address);
  console.log("Root node (ai-bot.eth):", ROOT_NODE);
  console.log("Registration price:", ethers.formatEther(REGISTRATION_PRICE), "ETH");
  console.log("Parent expiry:", new Date(Number(PARENT_EXPIRY) * 1000).toISOString());
  
  // Display contract info
  const info = await registrar.getContractInfo();
  console.log("\n📋 Contract Info:");
  console.log("- Name Wrapper:", info.wrapper);
  console.log("- Public Resolver:", info.resolver);
  console.log("- Root Node:", info.rootNodeHash);
  console.log("- Price:", ethers.formatEther(info.price), "ETH");
  console.log("- Parent Expiry:", info.expiry.toString());
  console.log("- Owner:", info.contractOwner);
  
  console.log("\n🤖 Next steps:");
  console.log("1. Approve this contract address in Name Wrapper");
  console.log("2. Agents can register subdomains!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
