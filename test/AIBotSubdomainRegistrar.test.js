import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";

describe("AIBotSubdomainRegistrar", function () {
  let registrar;
  let owner;
  let agent1;
  let agent2;
  
  const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";
  const ROOT_NODE = ethers.namehash("ai-bot.eth");
  const REGISTRATION_PRICE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, agent1, agent2] = await ethers.getSigners();
    
    const AIBotSubdomainRegistrar = await ethers.getContractFactory("AIBotSubdomainRegistrar");
    registrar = await AIBotSubdomainRegistrar.deploy(
      ENS_REGISTRY,
      PUBLIC_RESOLVER,
      ROOT_NODE,
      REGISTRATION_PRICE
    );
    await registrar.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await registrar.owner()).to.equal(owner.address);
    });

    it("Should set the correct registration price", async function () {
      expect(await registrar.registrationPrice()).to.equal(REGISTRATION_PRICE);
    });

    it("Should return correct contract info", async function () {
      const info = await registrar.getContractInfo();
      expect(info.ensRegistry).to.equal(ENS_REGISTRY);
      expect(info.resolver).to.equal(PUBLIC_RESOLVER);
      expect(info.rootNodeHash).to.equal(ROOT_NODE);
      expect(info.price).to.equal(REGISTRATION_PRICE);
      expect(info.contractOwner).to.equal(owner.address);
    });
  });

  describe("Subdomain Availability", function () {
    it("Should show subdomain as available initially", async function () {
      expect(await registrar.isSubdomainAvailable("agent1")).to.be.true;
    });

    it("Should return correct subnode hash", async function () {
      const label = ethers.keccak256(ethers.toUtf8Bytes("agent1"));
      const expectedSubnode = ethers.keccak256(
        ethers.concat([ROOT_NODE, label])
      );
      expect(await registrar.getSubnodeHash("agent1")).to.equal(expectedSubnode);
    });
  });

  describe("Price Management", function () {
    it("Should allow owner to update price", async function () {
      const newPrice = ethers.parseEther("0.002");
      await expect(registrar.updatePrice(newPrice))
        .to.emit(registrar, "PriceUpdated")
        .withArgs(REGISTRATION_PRICE, newPrice);
      
      expect(await registrar.registrationPrice()).to.equal(newPrice);
    });

    it("Should not allow non-owner to update price", async function () {
      const newPrice = ethers.parseEther("0.002");
      await expect(
        registrar.connect(agent1).updatePrice(newPrice)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Ownership Transfer", function () {
    it("Should allow owner to transfer ownership", async function () {
      await registrar.transferOwnership(agent1.address);
      expect(await registrar.owner()).to.equal(agent1.address);
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        registrar.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        registrar.connect(agent1).transferOwnership(agent2.address)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
