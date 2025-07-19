// Contract configuration
const CONTRACT_ADDRESS = "0xEb19778999c20Df0Dd969Ab4D25Cb123Dd9c00F3";

// Load ABI from the JSON file
let CONTRACT_ABI = [];

// Load the ABI when the page loads
fetch('./LetterOfCreditABI.json')
    .then(response => response.json())
    .then(abi => {
        CONTRACT_ABI = abi;
    })
    .catch(error => {
        console.error('Error loading ABI:', error);
    });

class LetterOfCreditApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.userRole = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            this.showError('MetaMask is not installed. Please install MetaMask to use this app.');
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Check if already connected
        if (window.ethereum.selectedAddress) {
            await this.connectWallet();
        }
    }

    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // Contract interaction buttons
        const depositBtn = document.getElementById('depositFunds');
        if (depositBtn) {
            depositBtn.addEventListener('click', () => this.depositFunds());
        }

        const confirmShipmentBtn = document.getElementById('confirmShipment');
        if (confirmShipmentBtn) {
            confirmShipmentBtn.addEventListener('click', () => this.confirmShipment());
        }

        const verifyDocumentsBtn = document.getElementById('verifyDocuments');
        if (verifyDocumentsBtn) {
            verifyDocumentsBtn.addEventListener('click', () => this.verifyDocuments());
        }

        const releasePaymentBtn = document.getElementById('releasePayment');
        if (releasePaymentBtn) {
            releasePaymentBtn.addEventListener('click', () => this.releasePayment());
        }

        const refundBuyerBtn = document.getElementById('refundBuyer');
        if (refundBuyerBtn) {
            refundBuyerBtn.addEventListener('click', () => this.refundBuyer());
        }

        const getDetailsBtn = document.getElementById('getContractDetails');
        if (getDetailsBtn) {
            getDetailsBtn.addEventListener('click', () => this.getContractDetails());
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                this.userAddress = accounts[0];
                this.updateUI();
                this.getContractDetails();
            } else {
                this.disconnectWallet();
            }
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', (chainId) => {
            this.checkNetwork();
        });
    }

    async connectWallet() {
        try {
            this.showStatus('Connecting to MetaMask...');
            
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.userAddress = accounts[0];
            
            // Check network
            await this.checkNetwork();
            
            // Initialize provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Ensure ABI is loaded before initializing contract
            if (CONTRACT_ABI.length === 0) {
                this.showStatus('Loading contract ABI...');
                const response = await fetch('./LetterOfCreditABI.json');
                CONTRACT_ABI = await response.json();
            }
            
            // Initialize contract with JsonRpcProvider for read operations (like the working test)
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/eed037ae31bc401cb5104294f04d1163"));
            
            // Create a separate contract instance for write operations
            this.contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
            
            // Determine user role
            await this.determineUserRole();
            
            this.updateUI();
            this.showSuccess('Wallet connected successfully!');
            
            // Test contract communication
            await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    async checkNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const sepoliaChainId = '0xaa36a7'; // Sepolia chain ID
            
            if (chainId !== sepoliaChainId) {
                this.showWarning('Please switch to Sepolia testnet');
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: sepoliaChainId }],
                    });
                } catch (switchError) {
                    // If Sepolia is not added, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: sepoliaChainId,
                                chainName: 'Sepolia Testnet',
                                nativeCurrency: {
                                    name: 'Sepolia Ether',
                                    symbol: 'SEP',
                                    decimals: 18
                                },
                                rpcUrls: ['https://sepolia.infura.io/v3/eed037ae31bc401cb5104294f04d1163'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }]
                        });
                    }
                }
            }
        } catch (error) {
            this.showError('Network check failed: ' + error.message);
        }
    }

    async determineUserRole() {
        try {
            const contractDetails = await this.contract.getContractDetails();
            const [buyer, seller, arbiter] = contractDetails;
            
            if (this.userAddress.toLowerCase() === buyer.toLowerCase()) {
                this.userRole = 'buyer';
            } else if (this.userAddress.toLowerCase() === seller.toLowerCase()) {
                this.userRole = 'seller';
            } else if (this.userAddress.toLowerCase() === arbiter.toLowerCase()) {
                this.userRole = 'arbiter';
            } else {
                this.userRole = 'viewer';
            }
            
            console.log('User role determined:', this.userRole);
        } catch (error) {
            console.error('Error determining user role:', error);
            this.userRole = 'viewer';
        }
    }

    async getContractDetails() {
        try {
            this.showStatus('Fetching contract details...');
            
            const details = await this.contract.getContractDetails();
            const [
                buyer, seller, arbiter, amount, state, createdAt, 
                fundsDepositedAt, shipmentConfirmedAt, documentsVerifiedAt, 
                paymentReleasedAt, refundProcessedAt, shipmentDeadline, 
                verificationDeadline
            ] = details;
            
            const stateNames = ['Initiated', 'Funded', 'Shipped', 'Verified', 'Completed', 'Refunded'];
            const currentState = stateNames[state];
            
            const contractInfo = {
                buyer,
                seller,
                arbiter,
                amount: ethers.utils.formatEther(amount),
                state: currentState,
                createdAt: new Date(createdAt * 1000).toLocaleString(),
                fundsDepositedAt: fundsDepositedAt > 0 ? new Date(fundsDepositedAt * 1000).toLocaleString() : 'Not deposited',
                shipmentConfirmedAt: shipmentConfirmedAt > 0 ? new Date(shipmentConfirmedAt * 1000).toLocaleString() : 'Not confirmed',
                documentsVerifiedAt: documentsVerifiedAt > 0 ? new Date(documentsVerifiedAt * 1000).toLocaleString() : 'Not verified',
                paymentReleasedAt: paymentReleasedAt > 0 ? new Date(paymentReleasedAt * 1000).toLocaleString() : 'Not released',
                refundProcessedAt: refundProcessedAt > 0 ? new Date(refundProcessedAt * 1000).toLocaleString() : 'Not refunded',
                shipmentDeadline: new Date(shipmentDeadline * 1000).toLocaleString(),
                verificationDeadline: new Date(verificationDeadline * 1000).toLocaleString()
            };
            
            console.log('Contract Details:', contractInfo);
            this.displayContractInfo(contractInfo);
            this.showSuccess('Contract details fetched successfully!');
            
        } catch (error) {
            this.showError('Failed to get contract details: ' + error.message);
        }
    }

    displayContractInfo(info) {
        const infoContainer = document.getElementById('contractInfo');
        if (infoContainer) {
            infoContainer.innerHTML = `
                <h3>Contract Information</h3>
                <div class="info-grid">
                    <div><strong>Current State:</strong> ${info.state}</div>
                    <div><strong>Amount:</strong> ${info.amount} ETH</div>
                    <div><strong>Buyer:</strong> ${info.buyer}</div>
                    <div><strong>Seller:</strong> ${info.seller}</div>
                    <div><strong>Arbiter:</strong> ${info.arbiter}</div>
                    <div><strong>Created:</strong> ${info.createdAt}</div>
                    <div><strong>Funds Deposited:</strong> ${info.fundsDepositedAt}</div>
                    <div><strong>Shipment Confirmed:</strong> ${info.shipmentConfirmedAt}</div>
                    <div><strong>Documents Verified:</strong> ${info.documentsVerifiedAt}</div>
                    <div><strong>Payment Released:</strong> ${info.paymentReleasedAt}</div>
                    <div><strong>Refund Processed:</strong> ${info.refundProcessedAt}</div>
                    <div><strong>Shipment Deadline:</strong> ${info.shipmentDeadline}</div>
                    <div><strong>Verification Deadline:</strong> ${info.verificationDeadline}</div>
                </div>
            `;
        }
    }

    async depositFunds() {
        try {
            const amount = document.getElementById('depositAmount').value;
            if (!amount || amount <= 0) {
                this.showError('Please enter a valid amount');
                return;
            }
            
            this.showStatus('Depositing funds...');
            const tx = await this.contractWithSigner.depositFunds({ 
                value: ethers.utils.parseEther(amount) 
            });
            
            this.showStatus('Waiting for transaction confirmation...');
            await tx.wait();
            
            this.showSuccess('Funds deposited successfully!');
            await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to deposit funds: ' + error.message);
        }
    }

    async confirmShipment() {
        try {
            this.showStatus('Confirming shipment...');
            const tx = await this.contractWithSigner.confirmShipment();
            
            this.showStatus('Waiting for transaction confirmation...');
            await tx.wait();
            
            this.showSuccess('Shipment confirmed successfully!');
            await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to confirm shipment: ' + error.message);
        }
    }

    async verifyDocuments() {
        try {
            this.showStatus('Verifying documents...');
            const tx = await this.contractWithSigner.verifyDocuments();
            
            this.showStatus('Waiting for transaction confirmation...');
            await tx.wait();
            
            this.showSuccess('Documents verified successfully!');
            await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to verify documents: ' + error.message);
        }
    }

    async releasePayment() {
        try {
            this.showStatus('Releasing payment...');
            const tx = await this.contractWithSigner.releasePayment();
            
            this.showStatus('Waiting for transaction confirmation...');
            await tx.wait();
            
            this.showSuccess('Payment released successfully!');
            await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to release payment: ' + error.message);
        }
    }

    async refundBuyer() {
        try {
            this.showStatus('Processing refund...');
            const tx = await this.contractWithSigner.refundBuyer();
            
            this.showStatus('Waiting for transaction confirmation...');
            await tx.wait();
            
            this.showSuccess('Refund processed successfully!');
            await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to process refund: ' + error.message);
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.userRole = null;
        this.updateUI();
        this.showInfo('Wallet disconnected');
    }

    updateUI() {
        const connectBtn = document.getElementById('connectWallet');
        const userInfo = document.getElementById('userInfo');
        const actionButtons = document.getElementById('actionButtons');
        
        if (this.userAddress) {
            if (connectBtn) connectBtn.textContent = 'Disconnect';
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-info">
                        <strong>Connected:</strong> ${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}
                        <br><strong>Role:</strong> ${this.userRole || 'Unknown'}
                    </div>
                `;
            }
            if (actionButtons) actionButtons.style.display = 'block';
        } else {
            if (connectBtn) connectBtn.textContent = 'Connect Wallet';
            if (userInfo) userInfo.innerHTML = '';
            if (actionButtons) actionButtons.style.display = 'none';
        }
    }

    showStatus(message) {
        console.log(message);
        this.updateStatus(message, 'status');
    }

    showSuccess(message) {
        console.log('Success:', message);
        this.updateStatus(message, 'success');
    }

    showError(message) {
        console.error('Error:', message);
        this.updateStatus(message, 'error');
    }

    showWarning(message) {
        console.warn('Warning:', message);
        this.updateStatus(message, 'warning');
    }

    showInfo(message) {
        console.log('Info:', message);
        this.updateStatus(message, 'info');
    }

    updateStatus(message, type) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LetterOfCreditApp();
}); 