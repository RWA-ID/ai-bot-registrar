// Deploy BotNamesRegistrar, approve it on the NameWrapper and verify it on Etherscan.
// The signer must be the ai-bot.eth owner (0x5f11…165b), since it grants the approval.
//
//   npx hardhat run scripts/deploy-botnames.cjs --network mainnet
//   REVOKE_V1=1 npx hardhat run scripts/deploy-botnames.cjs --network mainnet   # also stop the v1 registrar
const { ethers, run, network } = require("hardhat");

const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";
const V1_REGISTRAR = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89";
const PARENT_NODE = ethers.namehash("ai-bot.eth");
const FEE = ethers.parseEther("0.001");
// Pin the fees: hardhat's default max fee (~2x base) can exceed a lean deployer's balance upfront.
const GAS = {
  maxFeePerGas: ethers.parseUnits(process.env.MAX_FEE_GWEI || "1.1", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits(process.env.TIP_GWEI || "0.01", "gwei"),
};

async function main() {
  const [signer] = await ethers.getSigners();
  const wrapper = await ethers.getContractAt(
    [
      "function ownerOf(uint256) view returns (address)",
      "function setApprovalForAll(address,bool)",
      "function isApprovedForAll(address,address) view returns (bool)",
    ],
    NAME_WRAPPER
  );
  const parentOwner = await wrapper.ownerOf(PARENT_NODE);
  if (parentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`signer ${signer.address} is not the ai-bot.eth owner ${parentOwner}`);
  }
  console.log(`network ${network.name}, signer ${signer.address}`);

  const args = [NAME_WRAPPER, ENS_REGISTRY, PARENT_NODE, PUBLIC_RESOLVER, FEE];
  const registrar = await (await ethers.getContractFactory("BotNamesRegistrar")).deploy(...args, GAS);
  await registrar.waitForDeployment();
  const address = await registrar.getAddress();
  const deployRc = await registrar.deploymentTransaction().wait();
  if (deployRc.status !== 1) throw new Error("deploy reverted");
  console.log(`BotNamesRegistrar ${address} (tx ${deployRc.hash})`);

  const approveRc = await (await wrapper.setApprovalForAll(address, true, GAS)).wait();
  if (approveRc.status !== 1) throw new Error("approval reverted");
  console.log(`approved on NameWrapper (tx ${approveRc.hash})`);

  if (process.env.REVOKE_V1) {
    const revokeRc = await (await wrapper.setApprovalForAll(V1_REGISTRAR, false, GAS)).wait();
    if (revokeRc.status !== 1) throw new Error("v1 revoke reverted");
    console.log(`v1 registrar ${V1_REGISTRAR} revoked (tx ${revokeRc.hash})`);
  }
  console.log(`approvals: v2 ${await wrapper.isApprovedForAll(signer.address, address)}, v1 ${await wrapper.isApprovedForAll(signer.address, V1_REGISTRAR)}`);

  if (network.name === "mainnet") {
    // Etherscan needs a few blocks before it can see the bytecode
    await deployRc.getBlock();
    await new Promise((r) => setTimeout(r, 30_000));
    await run("verify:verify", { address, constructorArguments: args });
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
