# AI Bot ENS Subdomain Registrar

> Decentralized ENS subdomain registration service for AI agents on Ethereum

[![Ethereum](https://img.shields.io/badge/Ethereum-Mainnet-blue)](https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Compatible-green)](https://eips.ethereum.org/EIPS/eip-8004)

AI agents can register permanent ENS subdomains under `ai-bot.eth` for just 0.001 ETH. Fully autonomous, on-chain, and agent-first.

## 🚀 Live on Mainnet

- **Contract**: [`0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89`](https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89)
- **Parent Domain**: [ai-bot.eth](https://app.ens.domains/ai-bot.eth)
- **Registration Fee**: 0.001 ETH (~$3-4 USD)
- **First Agent**: [firstagent.ai-bot.eth](https://app.ens.domains/firstagent.ai-bot.eth)

## ✨ Features

- ✅ **One-time fee** - No renewals required
- ✅ **Instant registration** - Get your ENS name immediately
- ✅ **Automatic resolver** - Pre-configured for immediate use
- ✅ **Full ownership** - You control your subdomain completely
- ✅ **Event emission** - Discoverable by other agents
- ✅ **ERC-8004 compatible** - Works with AI agent standards

## 🤖 Quick Start

### For AI Agents
```javascript
import { ethers } from "ethers";

const REGISTRAR = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89";
const ABI = [...]; // See CONTRACT_ABI.json

const registrar = new ethers.Contract(REGISTRAR, ABI, signer);

// Register your subdomain
const tx = await registrar.registerSubdomain("myagent", {
  value: ethers.parseEther("0.001")
});

await tx.wait();
// You now own myagent.ai-bot.eth! 🎉
```

### Check Availability
```javascript
const available = await registrar.isSubdomainAvailable("myagent");
console.log(available ? "Available! ✅" : "Taken ❌");
```

## 📚 Documentation

- **[Integration Examples](INTEGRATION_EXAMPLES.md)** - Complete code examples in JavaScript & Python
- **[ERC-8004 Integration](ERC8004_INTEGRATION.md)** - Agent discovery and compatibility
- **[Contract ABI](CONTRACT_ABI.json)** - Contract interface for developers
- **[Mainnet Launch Info](MAINNET_LAUNCH.md)** - Detailed launch information

## 🏗️ Architecture
```
┌─────────────────┐
│   AI Agent      │
└────────┬────────┘
         │ 0.001 ETH
         ▼
┌─────────────────────────────┐
│ AIBotSubdomainRegistrar     │
│ 0x309b7A...                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ ENS Name Wrapper            │
│ Creates: agent.ai-bot.eth   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ ENS Public Resolver         │
│ Sets records automatically  │
└─────────────────────────────┘
```

## 🔧 Contract Functions

### User Functions

| Function | Description | Payment |
|----------|-------------|---------|
| `registerSubdomain(string)` | Register a new subdomain | 0.001 ETH |
| `isSubdomainAvailable(string)` | Check availability | Free |
| `getAgentSubdomains(address)` | Get agent's subdomains | Free |
| `getContractInfo()` | Get contract details | Free |

### Admin Functions (Owner Only)

| Function | Description |
|----------|-------------|
| `updatePrice(uint256)` | Update registration fee |
| `updateParentExpiry(uint64)` | Update parent domain expiry |
| `withdraw()` | Withdraw collected fees |
| `transferOwnership(address)` | Transfer contract ownership |

## 📊 Events
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

Monitor these events to discover new agents joining the network.

## 💻 Development

### Prerequisites

- Node.js >= 18
- npm or yarn
- Hardhat
- Ethers.js v6

### Installation
```bash
git clone https://github.com/YOUR_USERNAME/ai-bot-registrar.git
cd ai-bot-registrar
npm install
```

### Testing
```bash
# Run tests on local network
npx hardhat test

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-wrapper.js --network sepolia
```

### Project Structure
```
ai-bot-registrar/
├── contracts/
│   └── AIBotSubdomainRegistrarWrapper.sol
├── scripts/
│   ├── deploy-wrapper.js
│   ├── test-mainnet-registration.js
│   └── check-expiry.js
├── test/
│   └── AIBotSubdomainRegistrar.test.js
├── CONTRACT_ABI.json
├── erc8004-registration.json
├── INTEGRATION_EXAMPLES.md
├── ERC8004_INTEGRATION.md
└── README.md
```

## 🌐 Example Use Cases

### Trading Agent
```javascript
// Register trading agent
await registrar.registerSubdomain("tradingbot");
// Now accessible at tradingbot.ai-bot.eth
```

### Research Agent
```javascript
// Register research agent
await registrar.registerSubdomain("researcher");
// Set description and URL via ENS resolver
```

### Social Agent
```javascript
// Register social media agent
await registrar.registerSubdomain("socialbot");
// Link to Twitter, Discord via ENS records
```

## 🔐 Security

- ✅ **Contract Verified** on Etherscan
- ✅ **Open Source** - All code public
- ✅ **Immutable** - Cannot be upgraded
- ✅ **Non-custodial** - You own your subdomain
- ⚠️ **Unaudited** - Use at your own risk

## 📈 Stats

Track live statistics:
```javascript
// Get total registrations via events
const filter = registrar.filters.SubdomainRegistered();
const events = await registrar.queryFilter(filter);
console.log(`Total registrations: ${events.length}`);
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ENS](https://ens.domains/) - Ethereum Name Service
- [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) - Trustless Agents Standard
- [Hardhat](https://hardhat.org/) - Development environment
- [Ethers.js](https://docs.ethers.org/) - Ethereum library

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/ai-bot-registrar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/ai-bot-registrar/discussions)
- **Twitter**: [https://x.com/ai_bot_eth?s=20)

---

**Built with ❤️ for the AI agent ecosystem**

*Deployed: January 30, 2026*  
*First Agent: firstagent.ai-bot.eth*
