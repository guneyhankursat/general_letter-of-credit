# G-LOC (Letter of Credit Smart Contract)

A decentralized Letter of Credit (LoC) smart contract built on Ethereum that facilitates secure international trade transactions between buyers, sellers, and arbiters.

## 🚀 Live Contract

**Contract Address:** `0x942493255D20775DbEa565104B3CD35F7C0EfED7`  
**Network:** Sepolia Testnet  
**Explorer:** [View on Etherscan](https://sepolia.etherscan.io/address/0x942493255D20775DbEa565104B3CD35F7C0EfED7)

## 📋 Features

- **Multi-party Agreement:** Buyer, Seller, and Arbiter roles
- **State Machine:** Automated workflow with clear state transitions
- **Time-based Deadlines:** Shipment and verification deadlines
- **Secure Payments:** Escrow functionality with conditional releases
- **Event Logging:** Comprehensive event tracking for transparency
- **Reentrancy Protection:** Security against reentrancy attacks

## 🏗️ Contract States

1. **Initiated** - Contract created with initial parameters
2. **Funded** - Buyer deposits funds into escrow
3. **Shipped** - Seller confirms shipment
4. **Verified** - Arbiter verifies documents
5. **Completed** - Payment released to seller
6. **Refunded** - Funds returned to buyer (if deadlines missed)

## 🛠️ Technology Stack

- **Solidity:** 0.8.20
- **Hardhat:** Development and deployment framework
- **OpenZeppelin:** Security contracts and utilities
- **Ethers.js:** Ethereum interaction library

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd G-LOC

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

## 🔧 Configuration

1. Create a `.env` file based on `env.example`:
```bash
SEPOLIA_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_private_key
SELLER_ADDRESS=0x...
ARBITER_ADDRESS=0x...
```

2. Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## 📁 Project Structure

```
G-LOC/
├── contracts/
│   └── LetterOfCredit.sol    # Main smart contract
├── scripts/
│   └── deploy.js             # Deployment script
├── test/                     # Test files
├── hardhat.config.js         # Hardhat configuration
├── contract-address.json     # Deployed contract address
├── contract-abi.json         # Contract ABI
├── index.html               # Frontend interface
└── README.md               # This file
```

## 🔗 Contract Functions

### Core Functions
- `depositFunds()` - Buyer deposits funds into escrow
- `confirmShipment()` - Seller confirms shipment
- `verifyDocuments()` - Arbiter verifies documents
- `releasePayment()` - Release payment to seller
- `refundBuyer()` - Refund buyer if deadlines missed

### View Functions
- `getContractDetails()` - Get complete contract state
- State variables for all contract data

## 🎯 Usage

### For Frontend Integration

```javascript
// Import contract data
import contractAddress from './contract-address.json';
import contractABI from './contract-abi.json';

// Initialize contract
const contract = new ethers.Contract(
  contractAddress.contractAddress,
  contractABI,
  signer
);

// Example: Deposit funds
await contract.depositFunds({ value: ethers.parseEther("1.0") });
```

## 🔒 Security Features

- **ReentrancyGuard:** Prevents reentrancy attacks
- **Access Control:** Role-based function access
- **State Validation:** Ensures operations occur in correct states
- **Deadline Enforcement:** Automatic deadline checking
- **Safe Transfers:** Uses OpenZeppelin's safe transfer patterns

## 📊 Events

- `FundsDeposited` - When buyer deposits funds
- `ShipmentConfirmed` - When seller confirms shipment
- `DocumentsVerified` - When arbiter verifies documents
- `PaymentReleased` - When payment is released to seller
- `BuyerRefunded` - When buyer is refunded
- `StateChanged` - When contract state changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenZeppelin for security contracts
- Hardhat team for development framework
- Ethereum community for blockchain infrastructure

---

**Deployed on:** July 19, 2025  
**Network:** Sepolia Testnet  
**Contract:** `0x942493255D20775DbEa565104B3CD35F7C0EfED7`
