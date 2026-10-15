// Mainnet-fork tests for BotNamesRegistrar against the real NameWrapper + PublicResolver.
// Run: FORK_URL=<mainnet rpc> npx hardhat test test/BotNamesRegistrar.fork.test.js
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";
const PARENT_OWNER = "0x5f11a48230f7CdaB91A2361576239091E4b1165b";
const PARENT_NODE = ethers.namehash("ai-bot.eth");
const FEE = ethers.parseEther("0.001");

const PCC = 1 << 16;
const CAN_EXTEND_EXPIRY = 1 << 18;
const COIN_BTC = 0;
const COIN_SOL = 501;
const COIN_BASE = 2147492101; // 0x80000000 | 8453

const wrapperAbi = [
  "function getData(uint256) view returns (address owner, uint32 fuses, uint64 expiry)",
  "function setApprovalForAll(address,bool)",
  "function setSubnodeOwner(bytes32,string,address,uint32,uint64) returns (bytes32)",
  "function extendExpiry(bytes32,bytes32,uint64) returns (uint64)",
];
const resolverAbi = [
  "function setAddr(bytes32,address)",
  "function setAddr(bytes32,uint256,bytes)",
  "function setText(bytes32,string,string)",
  "function setContenthash(bytes32,bytes)",
  "function addr(bytes32) view returns (address)",
  "function addr(bytes32,uint256) view returns (bytes)",
  "function text(bytes32,string) view returns (string)",
  "function contenthash(bytes32) view returns (bytes)",
];

const describeFork = process.env.FORK_URL ? describe : describe.skip;

describeFork("BotNamesRegistrar (mainnet fork)", function () {
  this.timeout(300_000);

  let registrar, wrapper, resolver, ri, deployer, agent, other;

  const nodeOf = (label) => ethers.namehash(`${label}.ai-bot.eth`);

  function records(node, owner) {
    return [
      ri.encodeFunctionData("setAddr(bytes32,address)", [node, owner]),
      ri.encodeFunctionData("setAddr(bytes32,uint256,bytes)", [node, COIN_BASE, owner]),
      // raw ENSIP-9 bytes; the MCP encodes real BTC/SOL addresses
      ri.encodeFunctionData("setAddr(bytes32,uint256,bytes)", [node, COIN_BTC, "0x0014751e76e8199196d454941c45d1b3a323f1433bd6"]),
      ri.encodeFunctionData("setAddr(bytes32,uint256,bytes)", [node, COIN_SOL, "0x" + "11".repeat(32)]),
      ri.encodeFunctionData("setText", [node, "avatar", "ipfs://bafkreiexample"]),
      ri.encodeFunctionData("setContenthash", [node, "0xe3010170122000"]),
    ];
  }

  before(async () => {
    [deployer, agent, other] = await ethers.getSigners();
    wrapper = await ethers.getContractAt(wrapperAbi, NAME_WRAPPER);
    resolver = await ethers.getContractAt(resolverAbi, PUBLIC_RESOLVER);
    ri = resolver.interface;

    const F = await ethers.getContractFactory("BotNamesRegistrar");
    registrar = await F.deploy(NAME_WRAPPER, ENS_REGISTRY, PARENT_NODE, PUBLIC_RESOLVER, FEE);

    await network.provider.request({ method: "hardhat_impersonateAccount", params: [PARENT_OWNER] });
    await network.provider.send("hardhat_setBalance", [PARENT_OWNER, "0x56BC75E2D63100000"]);
    const parentOwner = await ethers.getSigner(PARENT_OWNER);
    await wrapper.connect(parentOwner).setApprovalForAll(await registrar.getAddress(), true);
  });

  it("registers, writes every record and hands over an emancipated name in one tx", async () => {
    const label = "botnames-fork-test";
    const node = nodeOf(label);
    expect(await registrar.available(label)).to.equal(true);

    const tx = await registrar.connect(agent).register(label, agent.address, records(node, agent.address), { value: FEE });
    const rc = await tx.wait();
    console.log(`      gas used, register + 6 records: ${rc.gasUsed}`);

    const [owner, fuses, expiry] = await wrapper.getData(node);
    expect(owner).to.equal(agent.address);
    expect(Number(fuses) & PCC).to.equal(PCC);
    expect(Number(fuses) & CAN_EXTEND_EXPIRY).to.equal(CAN_EXTEND_EXPIRY);
    const [, , parentExpiry] = await wrapper.getData(PARENT_NODE);
    expect(expiry).to.equal(parentExpiry);

    expect(await resolver["addr(bytes32)"](node)).to.equal(agent.address);
    expect(await resolver["addr(bytes32,uint256)"](node, COIN_BASE)).to.equal(agent.address.toLowerCase());
    expect(await resolver["addr(bytes32,uint256)"](node, COIN_BTC)).to.equal("0x0014751e76e8199196d454941c45d1b3a323f1433bd6");
    expect(await resolver["addr(bytes32,uint256)"](node, COIN_SOL)).to.equal("0x" + "11".repeat(32));
    expect(await resolver.text(node, "avatar")).to.equal("ipfs://bafkreiexample");
    expect(await resolver.contenthash(node)).to.equal("0xe3010170122000");

    expect(await ethers.provider.getBalance(await registrar.getAddress())).to.equal(FEE);
    expect(await registrar.available(label)).to.equal(false);
    await expect(registrar.connect(other).register(label, other.address, [], { value: FEE }))
      .to.be.revertedWithCustomError(registrar, "NameTaken");

    // the new owner keeps editing its own records afterwards
    await resolver.connect(agent).setText(node, "url", "https://botnames.dev");
    expect(await resolver.text(node, "url")).to.equal("https://botnames.dev");
  });

  it("registers with no records, to an owner other than the payer, refunding overpayment", async () => {
    const label = "botnames-bare";
    const before = await ethers.provider.getBalance(agent.address);
    const tx = await registrar.connect(agent).register(label, other.address, [], { value: FEE * 3n });
    const rc = await tx.wait();
    const spent = before - (await ethers.provider.getBalance(agent.address));
    expect(spent).to.equal(FEE + rc.gasUsed * rc.gasPrice);
    const [owner] = await wrapper.getData(nodeOf(label));
    expect(owner).to.equal(other.address);
  });

  it("the parent owner cannot take a name back", async () => {
    const parentOwner = await ethers.getSigner(PARENT_OWNER);
    await expect(
      wrapper.connect(parentOwner).setSubnodeOwner(PARENT_NODE, "botnames-fork-test", parentOwner.address, 0, 0)
    ).to.be.reverted;
  });

  it("the owner can extend its own expiry (CAN_EXTEND_EXPIRY)", async () => {
    const node = nodeOf("botnames-fork-test");
    const labelhash = ethers.id("botnames-fork-test");
    const [, , parentExpiry] = await wrapper.getData(PARENT_NODE);
    await wrapper.connect(agent).extendExpiry(PARENT_NODE, labelhash, parentExpiry);
    const [, , expiry] = await wrapper.getData(node);
    expect(expiry).to.equal(parentExpiry);
  });

  it("refuses records aimed at another name", async () => {
    const label = "botnames-hijack";
    const victim = nodeOf("botnames-fork-test");
    const bad = [ri.encodeFunctionData("setText", [victim, "url", "https://evil.example"])];
    await expect(registrar.connect(other).register(label, other.address, bad, { value: FEE })).to.be.reverted;
    expect(await registrar.available(label)).to.equal(true);
  });

  it("treats the v1 registrar's names as taken", async () => {
    for (const label of ["klumpai", "abc", "joe", "firstagent"]) {
      expect(await registrar.available(label), label).to.equal(false);
      await expect(registrar.connect(other).register(label, other.address, [], { value: FEE }))
        .to.be.revertedWithCustomError(registrar, "NameTaken");
    }
  });

  it("rejects bad labels and short payment", async () => {
    for (const label of ["ab", "Upper", "a.b", "-lead", "trail-", "xn--abc", "has space", "émoji", "a".repeat(64)]) {
      expect(await registrar.validLabel(label), label).to.equal(false);
      await expect(registrar.connect(other).register(label, other.address, [], { value: FEE }))
        .to.be.revertedWithCustomError(registrar, "InvalidLabel");
    }
    expect(await registrar.validLabel("a".repeat(63))).to.equal(true);
    expect(await registrar.validLabel("my-bot-42")).to.equal(true);
    await expect(registrar.connect(other).register("cheap-bot", other.address, [], { value: FEE - 1n }))
      .to.be.revertedWithCustomError(registrar, "InsufficientFee");
  });

  it("refuses an owner contract that cannot receive ERC-1155", async () => {
    // the ENS registry is a contract with no onERC1155Received hook
    await expect(registrar.connect(other).register("botnames-noreceiver", ENS_REGISTRY, [], { value: FEE }))
      .to.be.reverted;
    expect(await registrar.available("botnames-noreceiver")).to.equal(true);
  });

  it("only the owner sets the fee and resolver and withdraws", async () => {
    await expect(registrar.connect(other).setFee(0)).to.be.revertedWithCustomError(registrar, "OwnableUnauthorizedAccount");
    await expect(registrar.connect(other).withdraw(other.address)).to.be.revertedWithCustomError(registrar, "OwnableUnauthorizedAccount");
    const bal = await ethers.provider.getBalance(await registrar.getAddress());
    await expect(registrar.withdraw(deployer.address)).to.changeEtherBalance(deployer, bal);
  });
});
