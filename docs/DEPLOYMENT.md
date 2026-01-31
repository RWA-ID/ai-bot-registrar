# Deployment Guide

## Pre-Deployment Checklist

Before deploying to mainnet, ensure you have:

1. ✅ **ENS Domain Ownership**
   - You must own `ai-bot.eth` on Ethereum mainnet
   - Transfer ownership to your deployer wallet or the contract after deployment

2. ✅ **Mainnet ETH**
   - Gas for deployment (~0.01-0.02 ETH)
   - Test the contract on a testnet first (Sepolia recommended)

3. ✅ **Wallet Setup**
   - Private key in environment variables
   - Never commit private keys to git

## Step 1: Test on Sepolia
```bash
# Add Sepolia network to hardhat.config.js
npx hardhat run scripts/deploy.js --network sepolia
```

## Step 2: Deploy to Mainnet
```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

## Step 3: Transfer ENS Ownership

After deployment, you need to:

1. Go to ENS App (app.ens.domains)
2. Find your `ai-bot.eth` domain
3. Transfer ownership to the contract address
4. This allows the contract to create subdomains

## Step 4: Verify Contract
```bash
npx hardhat verify --network mainnet DEPLOYED_ADDRESS <constructor args>
```

## Step 5: Test Registration
```bash
REGISTRAR_ADDRESS=0x... npx hardhat run scripts/agent-example.js --network mainnet
```

## Configuration

Update `hardhat.config.js` with:
```javascript
networks: {
  sepolia: {
    url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    accounts: [PRIVATE_KEY]
  },
  mainnet: {
    url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    accounts: [PRIVATE_KEY]
  }
}
```

## Post-Deployment

1. Update README.md with deployed contract address
2. Create ABI file for agents
3. Announce on ERC-8004 community channels
4. Set up monitoring for registrations
5. Create documentation site (optional)

## Security Notes

- Contract is immutable after deployment
- Owner can only update price and withdraw fees
- Owner cannot revoke subdomains
- All registrations are permanent
