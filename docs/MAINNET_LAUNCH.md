# AI Bot ENS Subdomain Registrar - LIVE ON MAINNET! 🚀

Agent-first ENS subdomain registration service for `ai-bot.eth`

## 🌐 Contract Details

**Network:** Ethereum Mainnet  
**Contract Address:** `0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89`  
**Registration Fee:** 0.001 ETH (~$3-4 USD)  
**Domain:** ai-bot.eth  

**View Contract:**  
- Etherscan: https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89
- ENS App: https://app.ens.domains/ai-bot.eth

## 🤖 For AI Agents

### Quick Start
```javascript
const registrarAddress = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89";
const registrarABI = [...]; // Get from Etherscan

const registrar = new ethers.Contract(registrarAddress, registrarABI, signer);

// Check availability
const available = await registrar.isSubdomainAvailable("myagent");

// Register subdomain
const tx = await registrar.registerSubdomain("myagent", {
  value: ethers.parseEther("0.001")
});

await tx.wait();
// You now own myagent.ai-bot.eth!
```

### What You Get

✅ **Subdomain**: `yourname.ai-bot.eth`  
✅ **Automatic Resolver**: Pre-configured ENS Public Resolver  
✅ **Full Ownership**: Set records, transfer, manage as you wish  
✅ **Permanent**: One-time fee, no renewals  

### Setting Records

After registration, set your records:
```javascript
const publicResolver = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";
const resolver = new ethers.Contract(publicResolver, resolverABI, signer);

const namehash = ethers.namehash("myagent.ai-bot.eth");

// Set ETH address
await resolver["setAddr(bytes32,address)"](namehash, yourAddress);

// Set avatar
await resolver.setText(namehash, "avatar", "ipfs://...");

// Set description
await resolver.setText(namehash, "description", "AI Trading Agent");
```

## 📊 Contract Functions

### `registerSubdomain(string subdomain)`
Register a new subdomain. Requires 0.001 ETH payment.

**Returns:** bytes32 (subdomain namehash)

### `isSubdomainAvailable(string subdomain)`
Check if a subdomain is available.

**Returns:** bool

### `getAgentSubdomains(address agent)`
Get all subdomains registered by an agent.

**Returns:** string[]

### `getContractInfo()`
Get contract configuration.

**Returns:** (wrapper, resolver, rootNode, price, expiry, owner)

## 🔍 Events

Monitor these events for agent discovery:
```solidity
event SubdomainRegistered(
    string subdomain,
    address indexed owner,
    bytes32 indexed label,
    bytes32 subnode,
    uint256 price,
    uint256 timestamp
);
```

## 💡 Best Practices

- **Naming**: Use lowercase alphanumeric characters (no hyphens for best UI compatibility)
- **Gas**: ~220k gas per registration
- **Verification**: Always check `isSubdomainAvailable()` first
- **Records**: Set your records immediately after registration

## 🔗 Integration with ERC-8004

This registrar is designed for ERC-8004 AI Agent Identity standard:

1. Register your ENS subdomain here
2. Create your ERC-8004 Agent Identity
3. Link the two in your agent card
4. Complete decentralized agent identity!

## 📈 Statistics

- **First Registration:** firstagent.ai-bot.eth
- **Launch Date:** January 30, 2026
- **Total Registrations:** Query via events

## 🛠️ Admin Functions

Only contract owner can call:
- `updatePrice(uint256)` - Update registration price
- `updateParentExpiry(uint64)` - Update parent domain expiry
- `withdraw()` - Withdraw collected fees
- `transferOwnership(address)` - Transfer contract ownership

## 📞 Support

- GitHub: [Your repo]
- ENS Forum: [Your thread]
- Twitter: [Your handle]

## 📜 License

MIT
