# ERC-8004 Integration Guide

## What is the ERC-8004 Registration File?

The `erc8004-registration.json` file makes your AI Bot ENS Subdomain Registrar discoverable by AI agents using the ERC-8004 "Trustless Agents" standard.

## How to Use This File

### Step 1: Host the File

Upload `erc8004-registration.json` to a publicly accessible location:

**Option A: IPFS (Recommended - Decentralized)**
```bash
# Using Pinata
curl -X POST "https://api.pinata.cloud/pinning/pinJSONToIPFS" \
  -H "Authorization: Bearer YOUR_PINATA_JWT" \
  -H "Content-Type: application/json" \
  -d @erc8004-registration.json

# You'll get: ipfs://QmXXXXXX...
```

**Option B: GitHub**
```
https://raw.githubusercontent.com/your-repo/ai-bot-registrar/main/erc8004-registration.json
```

**Option C: Your Website**
```
https://your-domain.com/.well-known/erc8004-registration.json
```

### Step 2: Register Your Service in ERC-8004

Once you have the registration file URL, you can register your service in the ERC-8004 Identity Registry:
```javascript
// Example: Register your service as an ERC-8004 agent
const identityRegistry = "0x..."; // ERC-8004 Identity Registry address
const registrationURI = "ipfs://QmXXX..."; // Your registration file

const tx = await identityRegistry.register(
  "AI Bot ENS Registrar",
  registrationURI
);

await tx.wait();
console.log("Service registered in ERC-8004!");
```

### Step 3: Agent Discovery

AI agents can now discover your service:
```javascript
// Agent discovers your service
const agentId = await identityRegistry.getAgentByName("AI Bot ENS Registrar");
const registrationURI = await identityRegistry.getAgentURI(agentId);

// Fetch registration file
const response = await fetch(registrationURI);
const serviceInfo = await response.json();

console.log("Service:", serviceInfo.name);
console.log("Contract:", serviceInfo.technical["contract-address"]);
console.log("Fee:", serviceInfo.pricing["registration-fee"].amount, "ETH");
```

## What's in the Registration File?

The file contains complete information about your service:

- **Identity**: Name, description, logo
- **Services**: Smart contract address, documentation
- **Capabilities**: What your service can do
- **Technical**: Contract details, blockchain info
- **Pricing**: Registration fees and costs
- **Usage**: How to integrate and use
- **Trust**: Verification and security info

## Example: Agent Auto-Discovery Flow
```javascript
// 1. Agent searches ERC-8004 registry for ENS services
const services = await searchRegistry({ tag: "ens" });

// 2. Agent finds AI Bot Registrar
const registrar = services.find(s => s.name.includes("AI Bot"));

// 3. Agent reads registration file
const info = await fetch(registrar.uri).then(r => r.json());

// 4. Agent checks if it meets requirements
if (info.pricing["registration-fee"].amount <= agentBudget) {
  // 5. Agent registers automatically
  const contract = new ethers.Contract(
    info.technical["contract-address"],
    info.usage["contract-functions"],
    wallet
  );
  
  await contract.registerSubdomain("myagent", {
    value: ethers.parseEther(info.pricing["registration-fee"].amount)
  });
}
```

## Customizing the File

Update these fields in `erc8004-registration.json`:

1. **image**: Your service logo URL
2. **links**: Your GitHub, Discord, Twitter
3. **contact**: Your support channels
4. **documentation**: Your docs URL

## Benefits of ERC-8004 Integration

✅ **Discoverable**: Agents can find your service automatically  
✅ **Standardized**: Works with all ERC-8004 compatible agents  
✅ **Trustless**: All info verifiable on-chain  
✅ **Composable**: Integrates with other agent services  
✅ **Future-proof**: Built on emerging AI agent standards  

## Next Steps

1. ✅ Host your registration file (IPFS recommended)
2. ✅ Register in ERC-8004 Identity Registry
3. ✅ Announce on ERC-8004 community channels
4. ✅ Add to 8004.org service directory
5. ✅ Monitor agent registrations via events

## Resources

- **ERC-8004 Spec**: https://eips.ethereum.org/EIPS/eip-8004
- **8004.org**: https://8004.org/
- **A2A Protocol**: https://github.com/agentprotocol/a2a
- **Community**: https://discord.gg/erc8004

---

Your service is now part of the decentralized AI agent economy! 🚀
