# AI Bot Subdomain Registrar - Integration Examples

Complete code examples for integrating with the AI Bot ENS Subdomain Registrar.

## Contract Details
```javascript
const REGISTRAR_ADDRESS = "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89";
const REGISTRATION_FEE = "0.001"; // ETH
const NETWORK = "mainnet"; // Ethereum Mainnet
```

---

## Example 1: Basic Registration (Node.js/ethers.js v6)
```javascript
import { ethers } from "ethers";
import fs from "fs";

// Load ABI
const ABI = JSON.parse(fs.readFileSync("./CONTRACT_ABI.json", "utf8"));

async function registerSubdomain(desiredName) {
  // Connect to Ethereum
  const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_KEY");
  const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
  
  // Connect to contract
  const registrar = new ethers.Contract(
    "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    ABI,
    wallet
  );
  
  console.log(`Checking availability of ${desiredName}...`);
  
  // Check if available
  const available = await registrar.isSubdomainAvailable(desiredName);
  
  if (!available) {
    throw new Error(`${desiredName} is already taken!`);
  }
  
  console.log(`✅ ${desiredName} is available!`);
  console.log("Registering...");
  
  // Register subdomain
  const tx = await registrar.registerSubdomain(desiredName, {
    value: ethers.parseEther("0.001")
  });
  
  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  console.log("✅ Registration successful!");
  console.log(`Your ENS name: ${desiredName}.ai-bot.eth`);
  console.log(`Transaction: https://etherscan.io/tx/${tx.hash}`);
  
  return {
    subdomain: desiredName,
    fullName: `${desiredName}.ai-bot.eth`,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
}

// Usage
registerSubdomain("myagent")
  .then(result => console.log("Result:", result))
  .catch(err => console.error("Error:", err));
```

---

## Example 2: Registration with Record Setting
```javascript
import { ethers } from "ethers";

// Public Resolver ABI (minimal)
const RESOLVER_ABI = [
  "function setAddr(bytes32 node, address addr) external",
  "function setText(bytes32 node, string calldata key, string calldata value) external"
];

const PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";

async function registerAndSetRecords(subdomain, agentInfo) {
  const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_KEY");
  const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
  
  // Step 1: Register subdomain
  const registrar = new ethers.Contract(
    "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    REGISTRAR_ABI,
    wallet
  );
  
  console.log("Step 1: Registering subdomain...");
  const tx = await registrar.registerSubdomain(subdomain, {
    value: ethers.parseEther("0.001")
  });
  await tx.wait();
  console.log("✅ Subdomain registered!");
  
  // Step 2: Set records
  const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, wallet);
  const namehash = ethers.namehash(`${subdomain}.ai-bot.eth`);
  
  console.log("Step 2: Setting records...");
  
  // Set ETH address
  if (agentInfo.ethAddress) {
    const addrTx = await resolver.setAddr(namehash, agentInfo.ethAddress);
    await addrTx.wait();
    console.log("✅ ETH address set");
  }
  
  // Set avatar
  if (agentInfo.avatar) {
    const avatarTx = await resolver.setText(namehash, "avatar", agentInfo.avatar);
    await avatarTx.wait();
    console.log("✅ Avatar set");
  }
  
  // Set description
  if (agentInfo.description) {
    const descTx = await resolver.setText(namehash, "description", agentInfo.description);
    await descTx.wait();
    console.log("✅ Description set");
  }
  
  // Set URL
  if (agentInfo.url) {
    const urlTx = await resolver.setText(namehash, "url", agentInfo.url);
    await urlTx.wait();
    console.log("✅ URL set");
  }
  
  console.log(`\n🎉 Complete! ${subdomain}.ai-bot.eth is fully configured!`);
  return `${subdomain}.ai-bot.eth`;
}

// Usage
const agentInfo = {
  ethAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  avatar: "ipfs://QmXyZ123...",
  description: "AI Trading Agent specializing in DeFi strategies",
  url: "https://myagent.example.com"
};

registerAndSetRecords("tradingagent", agentInfo);
```

---

## Example 3: Python Integration (web3.py)
```python
from web3 import Web3
import json

# Connect to Ethereum
w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR_KEY'))

# Load contract ABI
with open('CONTRACT_ABI.json', 'r') as f:
    abi = json.load(f)

# Contract setup
registrar_address = '0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89'
registrar = w3.eth.contract(address=registrar_address, abi=abi)

# Your account
account = w3.eth.account.from_key('YOUR_PRIVATE_KEY')

def register_subdomain(subdomain_name):
    """Register an ENS subdomain"""
    
    # Check availability
    available = registrar.functions.isSubdomainAvailable(subdomain_name).call()
    
    if not available:
        raise Exception(f"{subdomain_name} is already taken!")
    
    print(f"✅ {subdomain_name} is available!")
    
    # Build transaction
    tx = registrar.functions.registerSubdomain(subdomain_name).build_transaction({
        'from': account.address,
        'value': w3.to_wei(0.001, 'ether'),
        'gas': 300000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    
    # Sign and send
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    print(f"Transaction sent: {tx_hash.hex()}")
    
    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if receipt['status'] == 1:
        print(f"✅ Successfully registered {subdomain_name}.ai-bot.eth!")
        return tx_hash.hex()
    else:
        raise Exception("Transaction failed!")

# Usage
if __name__ == "__main__":
    result = register_subdomain("pythonagent")
    print(f"Transaction: https://etherscan.io/tx/{result}")
```

---

## Example 4: Monitoring Events (Discovery)
```javascript
import { ethers } from "ethers";

async function monitorRegistrations() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_KEY");
  
  const registrar = new ethers.Contract(
    "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    ABI,
    provider
  );
  
  console.log("👁️  Monitoring new agent registrations...");
  
  // Listen for new registrations
  registrar.on("SubdomainRegistered", (subdomain, owner, label, subnode, price, timestamp) => {
    console.log("\n🆕 New Agent Registered!");
    console.log("  Subdomain:", subdomain);
    console.log("  Full Name:", `${subdomain}.ai-bot.eth`);
    console.log("  Owner:", owner);
    console.log("  Price Paid:", ethers.formatEther(price), "ETH");
    console.log("  Time:", new Date(Number(timestamp) * 1000).toISOString());
    console.log("  View:", `https://app.ens.domains/${subdomain}.ai-bot.eth`);
  });
  
  // Get past registrations
  const filter = registrar.filters.SubdomainRegistered();
  const events = await registrar.queryFilter(filter, -10000); // Last ~10k blocks
  
  console.log(`\n📊 Found ${events.length} past registrations`);
  
  events.forEach(event => {
    console.log(`- ${event.args.subdomain}.ai-bot.eth (${event.args.owner})`);
  });
}

monitorRegistrations();
```

---

## Example 5: Check Your Subdomains
```javascript
async function getMySubdomains(walletAddress) {
  const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_KEY");
  
  const registrar = new ethers.Contract(
    "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    ABI,
    provider
  );
  
  const subdomains = await registrar.getAgentSubdomains(walletAddress);
  
  console.log(`Agent ${walletAddress} owns ${subdomains.length} subdomain(s):`);
  
  subdomains.forEach(subdomain => {
    console.log(`  - ${subdomain}.ai-bot.eth`);
  });
  
  return subdomains;
}

// Usage
getMySubdomains("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
```

---

## Example 6: Browser Integration (Frontend)
```javascript
// Modern browser with MetaMask
async function registerWithMetaMask(subdomain) {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }
  
  // Request account access
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const registrar = new ethers.Contract(
    "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    ABI,
    signer
  );
  
  // Check availability
  const available = await registrar.isSubdomainAvailable(subdomain);
  
  if (!available) {
    alert(`${subdomain} is already taken!`);
    return;
  }
  
  // Register
  const tx = await registrar.registerSubdomain(subdomain, {
    value: ethers.parseEther("0.001")
  });
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  alert(`Success! You now own ${subdomain}.ai-bot.eth`);
}

// HTML Button
// <button onclick="registerWithMetaMask('myagent')">Register ENS</button>
```

---

## Example 7: Batch Availability Check
```javascript
async function checkMultipleAvailability(subdomains) {
  const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_KEY");
  
  const registrar = new ethers.Contract(
    "0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    ABI,
    provider
  );
  
  const results = await Promise.all(
    subdomains.map(async (subdomain) => {
      const available = await registrar.isSubdomainAvailable(subdomain);
      return { subdomain, available };
    })
  );
  
  console.log("Availability Results:");
  results.forEach(({ subdomain, available }) => {
    const status = available ? "✅ Available" : "❌ Taken";
    console.log(`  ${subdomain}.ai-bot.eth: ${status}`);
  });
  
  return results;
}

// Usage
checkMultipleAvailability(["agent1", "agent2", "trader", "bot123"]);
```

---

## Error Handling Best Practices
```javascript
async function safeRegister(subdomain) {
  try {
    // Validate subdomain name
    if (!/^[a-z0-9]+$/.test(subdomain)) {
      throw new Error("Subdomain must be lowercase alphanumeric only");
    }
    
    if (subdomain.length > 32) {
      throw new Error("Subdomain too long (max 32 characters)");
    }
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const required = ethers.parseEther("0.002"); // Fee + gas buffer
    
    if (balance < required) {
      throw new Error("Insufficient ETH balance");
    }
    
    // Register
    const tx = await registrar.registerSubdomain(subdomain, {
      value: ethers.parseEther("0.001"),
      gasLimit: 300000 // Set explicit gas limit
    });
    
    const receipt = await tx.wait();
    
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    
    return {
      success: true,
      ensName: `${subdomain}.ai-bot.eth`,
      txHash: tx.hash
    };
    
  } catch (error) {
    console.error("Registration failed:", error.message);
    
    // Handle specific errors
    if (error.message.includes("Subdomain already taken")) {
      return { success: false, error: "Name unavailable" };
    }
    
    if (error.message.includes("Insufficient payment")) {
      return { success: false, error: "Payment too low" };
    }
    
    return { success: false, error: error.message };
  }
}
```

---

## Environment Setup

### Node.js Dependencies
```bash
npm install ethers@^6.0.0
```

### Python Dependencies
```bash
pip install web3 python-dotenv
```

### Environment Variables (.env)
```bash
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key_here
REGISTRAR_ADDRESS=0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89
```

---

## Testing on Sepolia

For testing, use the Sepolia testnet version:
```javascript
// Sepolia Contract (for testing)
const SEPOLIA_REGISTRAR = "0x16c92E4703bD40d9cfd7B4144389E49d5A453948";
const SEPOLIA_RPC = "https://sepolia.infura.io/v3/YOUR_KEY";
```

---

## Support & Resources

- **Contract:** https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89
- **ENS Docs:** https://docs.ens.domains/
- **Ethers.js Docs:** https://docs.ethers.org/
- **Web3.py Docs:** https://web3py.readthedocs.io/

Happy building! 🚀
