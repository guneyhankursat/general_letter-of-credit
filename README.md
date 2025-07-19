# Letter of Credit Smart Contract

A decentralized Letter of Credit (LoC) system built on Ethereum using Solidity smart contracts. This project implements a complete escrow system for international trade with role-based access control and automated deadline management.

## 🌟 Features

### Smart Contract Features
- **Role-based Access Control**: Buyer, Seller, and Arbiter roles
- **State Machine**: Automated workflow with clear state transitions
- **Deadline Management**: Automatic timeouts for shipment and verification
- **Escrow System**: Secure fund holding until conditions are met
- **Dispute Resolution**: Arbiter can resolve conflicts between parties

### Frontend Features
- **MetaMask Integration**: Seamless wallet connection
- **Real-time Updates**: Live contract state monitoring
- **Role-based UI**: Different interfaces for each role
- **Transaction Management**: Easy contract interaction
- **Network Validation**: Sepolia testnet support

## 📋 Contract Workflow

1. **Initiation**: Contract created with Buyer, Seller, and Arbiter addresses
2. **Deposit**: Buyer deposits funds into escrow
3. **Shipment**: Seller confirms goods shipment
4. **Verification**: Arbiter verifies documents and shipment
5. **Payment**: Funds released to Seller or refunded to Buyer
6. **Dispute Resolution**: Arbiter can resolve conflicts if needed

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MetaMask wallet
- Sepolia testnet ETH

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd G-LOC
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
```
Edit `.env` with your configuration:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
SELLER_ADDRESS=0x...
ARBITER_ADDRESS=0x...
```

4. **Deploy the contract**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

5. **Start the frontend**
```bash
python3 -m http.server 8080
```

6. **Open your browser**
Navigate to `http://localhost:8080`

## 📁 Project Structure

```
G-LOC/
├── contracts/
│   └── LetterOfCredit.sol          # Main smart contract
├── scripts/
│   └── deploy.js                   # Deployment script
├── frontend/
│   ├── index.html                  # Main UI
│   ├── app.js                      # Frontend logic
│   ├── contract.js                 # Contract constants
│   └── LetterOfCreditABI.json     # Contract ABI
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🔧 Configuration

### Smart Contract Configuration
- **Solidity Version**: 0.8.20
- **Network**: Sepolia testnet
- **Optimizer**: Enabled
- **Gas Limit**: Auto-estimated

### Frontend Configuration
- **Provider**: Infura Sepolia RPC
- **Library**: ethers.js v5
- **Wallet**: MetaMask integration
- **Network**: Sepolia testnet validation

## 🎯 Usage

### For Buyers
1. Connect MetaMask wallet
2. Deposit funds using the "Deposit Funds" button
3. Monitor contract state and deadlines
4. Funds are automatically released or refunded based on conditions

### For Sellers
1. Connect MetaMask wallet
2. Confirm shipment when goods are sent
3. Wait for Arbiter verification
4. Receive payment upon successful verification

### For Arbiters
1. Connect MetaMask wallet
2. Verify shipment and documents
3. Resolve disputes if necessary
4. Ensure fair resolution for all parties

## 🔍 Testing

### Contract Testing
```bash
npx hardhat test
```

### Frontend Testing
```bash
# Start local server
python3 -m http.server 8080

# Open debug page
http://localhost:8080/debug.html
```

### State Checking
```bash
node check-state.js
```

## 📊 Contract States

- **Initiated**: Contract created, waiting for deposit
- **Funded**: Funds deposited, waiting for shipment
- **Shipped**: Shipment confirmed, waiting for verification
- **Verified**: Documents verified, ready for payment
- **Completed**: Payment released to seller
- **Refunded**: Funds returned to buyer
- **Disputed**: Under arbiter review

## ⚠️ Important Notes

- **Testnet Only**: This is deployed on Sepolia testnet
- **Real ETH**: Use testnet ETH for transactions
- **Gas Fees**: All transactions require gas fees
- **Deadlines**: Respect contract deadlines to avoid automatic actions
- **Role Management**: Each address can have multiple roles

## 🛠️ Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Switch to Sepolia testnet
   - Check network connection

2. **Transaction Fails**
   - Verify sufficient testnet ETH
   - Check gas limits
   - Ensure correct role permissions

3. **Contract Details Not Loading**
   - Hard refresh browser (Ctrl+F5)
   - Check console for errors
   - Verify contract address

4. **Gas Estimation Errors**
   - Check contract state
   - Verify role permissions
   - Ensure deadlines haven't passed

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review contract documentation
- Test with debug tools provided

---

**Built with ❤️ using Solidity, Hardhat, and ethers.js**
