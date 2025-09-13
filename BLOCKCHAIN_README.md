# 🔗 Dristi AI Blockchain Integration

## Overview

Dristi AI now includes comprehensive blockchain features that enable:

- **Digital Health Passports** - Immutable health records stored on blockchain
- **DRST Coin Rewards** - ERC-20 tokens earned through health activities
- **VisionCoin System** - Tokens based on eye health condition analysis
- **Achievement NFT Badges** - Unique collectible badges for health milestones
- **Crypto Wallet** - Full-featured wallet supporting Ethereum and Bitcoin

## 🚀 Quick Start

### 1. Automated Setup (Recommended)

```bash
# Run the automated setup script
python setup_blockchain.py
```

This will:
- Install dependencies
- Compile smart contracts
- Run tests
- Deploy to local network
- Setup database tables
- Configure IPFS
- Create environment files

### 2. Manual Setup

If you prefer manual setup:

```bash
# Install blockchain dependencies
cd blockchain
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node  # In one terminal
npx hardhat run scripts/deploy.js --network localhost  # In another

# Setup database
cd ../backend
python migrations/add_blockchain_tables.py
```

## 📋 Prerequisites

- **Node.js** (v16+) and npm
- **Python** (3.8+) with pip
- **MetaMask** browser extension
- **IPFS** (optional, for decentralized storage)

### Required Python Packages

```bash
pip install web3 cryptography requests flask-jwt-extended
```

### Required Node.js Packages

```bash
cd blockchain
npm install hardhat @openzeppelin/contracts ethers
```

## 🏗️ Architecture

### Smart Contracts

1. **DigitalHealthPassport.sol** - Stores health record hashes with access control
2. **DRSTCoin.sol** - ERC-20 reward token for health activities
3. **VisionCoin.sol** - ERC-20 token based on eye health analysis
4. **AchievementNFT.sol** - ERC-721 NFT badges with charity donations

### Backend Services

- **WalletService** - Manages crypto wallets and transactions
- **Web3Service** - Interacts with smart contracts
- **IPFSService** - Handles decentralized storage
- **SecurityService** - Encryption and key management

### Frontend Components

- **WalletDashboard** - Main wallet interface
- **WalletConnect** - MetaMask integration
- **SendCrypto** - Transaction interface
- **HealthPassport** - Health records viewer
- **AchievementBadges** - NFT collection display

## 💰 Token Economics

### DRST Coin Rewards

- **Eye Test Completion**: 50 DRST
- **Daily Exercise**: 5 DRST (once per day)
- **Family Member Addition**: 20 DRST
- **Doctor Visit Discount**: Based on token balance

### VisionCoin Distribution

- **Normal Eye Health**: 10 VSC
- **Mild Abnormality**: 5 VSC
- **Severe Abnormality**: 0 VSC

### Achievement NFTs

- First Eye Test
- Vision Improved
- Family Complete
- Health Champion
- Early Detector
- Wellness Warrior

## 🔐 Security Features

- **Encrypted Private Keys** - PBKDF2 + Fernet encryption
- **Secure Authentication** - JWT tokens with expiration
- **Role-Based Access** - Emergency doctor access to health records
- **Input Validation** - Address and transaction validation
- **Secure Deletion** - Overwrite sensitive files

## 🌐 Network Support

### Ethereum Networks

- **Mainnet** - Production deployment
- **Goerli Testnet** - Testing and development
- **Sepolia Testnet** - Alternative testnet
- **Local Hardhat** - Development environment

### Bitcoin Networks

- **Mainnet** - Production Bitcoin transactions
- **Testnet** - Testing Bitcoin functionality

## 📱 Frontend Integration

### Wallet Connection

```typescript
import { useWeb3 } from '@/lib/web3/Web3Context';

const { connectWallet, isConnected, account } = useWeb3();
```

### Sending Transactions

```typescript
const response = await fetch('/api/blockchain/wallet/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: 'ETH',
    to_address: '0x...',
    amount: '0.1',
    password: 'wallet_password'
  }),
});
```

## 🔧 Configuration

### Environment Variables

Create `.env.blockchain` with:

```env
# Ethereum Configuration
ETHEREUM_NETWORK=goerli
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=5

# Smart Contract Addresses
DRST_COIN_ADDRESS=0x...
VISION_COIN_ADDRESS=0x...
HEALTH_PASSPORT_ADDRESS=0x...
ACHIEVEMENT_NFT_ADDRESS=0x...

# IPFS Configuration
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BLOCKCYPHER_TOKEN=your_token_here
```

## 🧪 Testing

### Smart Contract Tests

```bash
cd blockchain
npx hardhat test
```

### Backend API Tests

```bash
cd backend
python -m pytest tests/test_blockchain.py
```

## 🚀 Deployment

### Local Development

```bash
# Start local blockchain
cd blockchain
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment

```bash
# Deploy to Goerli testnet
npx hardhat run scripts/deploy.js --network goerli

# Verify contracts
npx hardhat verify --network goerli CONTRACT_ADDRESS
```

## 📊 API Endpoints

### Wallet Management

- `POST /api/blockchain/wallet/create` - Create new wallet
- `GET /api/blockchain/wallet/balances` - Get all balances
- `POST /api/blockchain/wallet/send` - Send cryptocurrency

### Health Records

- `POST /api/blockchain/health-passport/store` - Store health record
- `GET /api/blockchain/health-passport/records` - Get user records

### Tokens & NFTs

- `POST /api/blockchain/tokens/mint-drst` - Mint DRST tokens
- `POST /api/blockchain/tokens/mint-vsc` - Mint VisionCoins
- `POST /api/blockchain/nft/mint` - Mint achievement NFT

## 🔍 Monitoring

### Transaction Status

```bash
# Check transaction on Etherscan
https://goerli.etherscan.io/tx/TRANSACTION_HASH

# Check Bitcoin transaction
https://blockstream.info/testnet/tx/TRANSACTION_HASH
```

### Contract Verification

```bash
# Verify on Etherscan
npx hardhat verify --network goerli CONTRACT_ADDRESS
```

## 🆘 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Switch to correct network (Goerli/Sepolia)

2. **Transaction Failed**
   - Check gas price and limit
   - Verify sufficient balance
   - Ensure correct network

3. **Contract Not Found**
   - Verify contract addresses in config
   - Ensure contracts are deployed

4. **IPFS Connection Failed**
   - Start IPFS daemon: `ipfs daemon`
   - Check IPFS API URL in config

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

This blockchain integration is part of the Dristi AI project and follows the same license terms.

## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Web3.py Documentation](https://web3py.readthedocs.io)
- [MetaMask Documentation](https://docs.metamask.io)
- [IPFS Documentation](https://docs.ipfs.io)
