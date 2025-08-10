
// Contract configuration
const CONTRACT_ADDRESS = "0x779fECb1e368e7dffDDa45E88FC0445f1b468208";
const LOC_CONTRACT_ADDRESS = "0xF88a9af2B53f261AA6675b9C7C5BDD4d12c94949";

// Load ABI from the JSON file
let CONTRACT_ABI = [];
let LOC_CONTRACT_ABI = [];

// Load the ABI when the page loads
fetch('./abis/factory-contract-abi.json')
    .then(response => response.json())
    .then(abi => {
        LOC_CONTRACT_ABI = abi;
    })
    .catch(error => {
        console.error('Error loading ABI:', error);
    });
// Load the ABI when the page loads
fetch('./abis/contract-abi.json')
    .then(response => response.json())
    .then(abi => {
        CONTRACT_ABI = abi;
    })
    .catch(error => {
        console.error('Error loading ABI:', error);
    });


class PageNavigator {
    constructor() {
        this.pages = {
            home: document.getElementById('home-page'),
            dashboard: document.getElementById('dashboard-page'),
            about: document.getElementById('about-page'),
            contact: document.getElementById('contact-page')
        };
        this.mainNav = document.getElementById('main-nav');
        this.initialize();
    }

    initialize() {
        // Set up navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(link.getAttribute('data-page'));
            });
        });

        // Get Started button
        const getStartedBtn = document.getElementById('getStarted');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.showPage('dashboard'));
        }

        // Handle initial page load
        const initialPage = window.location.hash.substring(1) || 'home';
        this.showPage(initialPage);
    }

    showPage(pageId) {
        // Hide all pages
        Object.values(this.pages).forEach(page => {
            page?.classList.remove('active');
        });
        
        // Show selected page
        if (this.pages[pageId]) {
            this.pages[pageId].classList.add('active');
        }
        
        // Show/hide main navigation
        if (this.mainNav) {
            this.mainNav.classList.toggle('hidden', pageId === 'home');
        }
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === pageId);
        });
    }
}


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
        // Create LoC button
        const createLoCBtn = document.getElementById('createLoC');
        if (createLoCBtn) {
            createLoCBtn.addEventListener('click', () => this.createLoC());
        }
        //renderLocs
        const refreshBtn = document.getElementById('refreshLocs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.updateAndRenderLocs());
        }
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                this.userAddress = accounts;
                this.updateUI();
                //this.getContractDetails();
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
            
            // Check network
            await this.checkNetwork();
            
            // Initialize provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.accounts = await this.signer.getAddress();
            this.userAddress = this.accounts;
            // Ensure ABI is loaded before initializing contract
            if (LOC_CONTRACT_ABI.length === 0) {
                this.showStatus('Loading contract ABI...');
                const response = await fetch('./abis/factory-contract-abi.json');
                LOC_CONTRACT_ABI = await response.json();
            }
            
            // Initialize contract with JsonRpcProvider for read operations (like the working test)
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/eed037ae31bc401cb5104294f04d1163"));
            
            // // Create a separate contract instance for write operations
            this.contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
                        
            this.updateUI();
            this.showSuccess('Wallet connected successfully!');
            this.updateAndRenderLocs();

            // // Test contract communication
            // await this.getContractDetails();
            
        } catch (error) {
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    async fetchUserLocs(userAddress, signer){
        try {
            const factory = new ethers.Contract(LOC_CONTRACT_ADDRESS, LOC_CONTRACT_ABI, signer);
            console.log(userAddress)
            const locAddresses = await factory.getContractsForUser(userAddress);
            console.log("Fetched LOC addresses:", locAddresses);
            const locs = [];
            for (const addr of locAddresses) {
                const loc = new ethers.Contract(addr, CONTRACT_ABI, signer);
                const details = await loc.getContractDetails();
                const role = await factory.getUserRoleInContract(userAddress, addr);
                loc.role = role;
                loc.details = details;
                loc.addr = addr;
                console.log("loc address:", addr);
                console.log("role:", role);
                console.log("state:", details[4]);
                locs.push(loc);
            }
            console.log("Fetched LoCs:", locs);
            return locs;
        } catch (error) {
            console.error('Error fetching user LOCs:', error);
            return [];
        }
    }

    async createLoC(){
        try {
            const seller = document.getElementById('sellerAddress').value;
            const arbiter = document.getElementById('arbiterAddress').value;
            const shipmentDeadline = document.getElementById('shipmentDeadline').value;
            const verificationDeadline = document.getElementById('verificationDeadline').value;
            const factory = new ethers.Contract(LOC_CONTRACT_ADDRESS, LOC_CONTRACT_ABI, this.signer);
            const tx = await factory.createLoC(
                this.userAddress,
                seller, 
                arbiter,
                shipmentDeadline, 
                verificationDeadline 
            );
            this.showStatus('Creating Letter of Credit...');
            await tx.wait();
            this.showSuccess('Letter of Credit created successfully!');
            document.getElementById('sellerAddress').value = '';
            document.getElementById('arbiterAddress').value = '';
            document.getElementById('shipmentDeadline').value = '';
            document.getElementById('verificationDeadline').value = '';
            await this.fetchUserLocs(this.userAddress, this.signer);
        } catch (error) {
            this.showError('Failed to create Letter of Credit: ' + error.message);
        }
    }
    // Fetch and render user LOCs
    async updateAndRenderLocs() {
        const locs = await this.fetchUserLocs(this.userAddress, this.signer);
        await this.renderLocs(locs);
    }

    // Handle various actions on a LOC contract
    async handleAction(loc, action){
        try {
            console.log(`Processing ${action}...`);
            let tx;
            switch (action) {
                case "depositFunds": {
                    const amount = prompt("Enter deposit amount in ETH:");
                    if (!amount || amount <= 0) {
                        this.showError('Please enter a valid amount');
                        return;
                    }
                    this.showStatus('Depositing funds...');
                    tx = await loc.depositFunds({ 
                        value: ethers.utils.parseEther(amount) 
                    });
                    break;
                    }
                case "confirmShipment":
                    tx = await loc.confirmShipment();
                    break;
                case "verifyDocuments":
                    tx = await loc.verifyDocuments();
                    break;
                case "releasePayment":
                    tx = await loc.releasePayment();
                    break;
                case "refundBuyer":
                    tx = await loc.refundBuyer();
                    break;
                default:
                    alert("Invalid action");
                    return;
            }
            console.log("Waiting for transaction confirmation...");
            await tx.wait();
            console.log(`${action} executed successfully`);
            await this.updateAndRenderLocs();
            alert(`${action} successful!`);
        } catch (err) {
            console.error(`Error during ${action}:`, err);
            alert(`Failed to ${action}: ${err.message}`);
        }
    };

    // Dynamically render the buttons and information for each LOC based on the user's role
    async renderLocs(locs) {
        const listContainer = document.getElementById("loc-list");
        listContainer.innerHTML = ""; // clear previous

        if (locs.length === 0) {
            alert("No Letters of Credit found");
            return;
        }

        for (const loc of locs) {
            const statusText = await this.renderLoCState(loc.details[4]);
            const amountText = await ethers.utils.formatEther(loc.details[3]);
            const card = document.createElement("div");
            card.className = "card p-4";
            card.innerHTML = `
                <p><strong>Contract Address:</strong> ${loc.address}</p>
                <p><strong>Role in LoC:</strong> ${loc.role}</p>
                <p><strong>Status:</strong> ${statusText}</p>
                <p><strong>Amount:</strong> ${amountText} ETH</p>
            `;
            //action buttons
            if (loc.role === "Buyer" && Number(loc.details[4]) === 0) {
                const btn = document.createElement("button");
                btn.textContent = "Deposit";
                btn.id = "depositFunds";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "depositFunds"));
                card.appendChild(btn);
            }
            if (loc.role === "Seller" && Number(loc.details[4]) === 1) {
                const btn = document.createElement("button");
                btn.textContent = "Confirm Shipment";
                btn.id = "confirmShipment";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "confirmShipment"));
                card.appendChild(btn);
            }
            if (loc.role === "Bank" && Number(loc.details[4]) === 2) {
                const btn = document.createElement("button");
                btn.textContent = "Verify Documents";
                btn.id = "verifyDocuments";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "verifyDocuments"));
                card.appendChild(btn);
            }
            if (["Buyer", "Bank"].includes(loc.role) && Number(loc.details[4]) === 3) {
                const btn = document.createElement("button");
                btn.textContent = "Release Payment";
                btn.id = "releasePayment";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "releasePayment"));
                card.appendChild(btn);
            }
            if (loc.role === "Buyer" && Number(loc.details[4]) === 4) {
                const btn = document.createElement("button");
                btn.textContent = "Request Refund";
                btn.id = "refundBuyer";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "refundBuyer"));
                card.appendChild(btn);
            }
            if (["Buyer", "Seller", "Bank"].includes(loc.role) && Number(loc.details[4]) === 4) {
                const btn = document.createElement("button");
                btn.textContent = "Download PDF";
                btn.id = "downloadPdf";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.onclick = () => this.downloadPdf(loc);
                card.appendChild(btn);
            }
            listContainer.appendChild(card);
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

    // Render the LOC state based on the enum value (index 4 of details)
    async renderLoCState(state){
        const states = ["Initiated", "Funded", "Shipped", "Verified", "Completed", "Refunded"];
        return states[state] || "Unknown";
    };

    // Download PDF summary of the LOC
    async downloadPdf(loc){
        const [
        buyer,
        seller,
        arbiter,
        amount,
        state,
        createdAt,
        fundsDepositedAt,
        shipmentConfirmedAt,
        documentsVerifiedAt,
        paymentReleasedAt,
        refundProcessedAt,
        shipmentDeadline,
        verificationDeadline
        ] = loc.details;

        const formatDate = (timestamp) => {
        const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
        return ts > 0 ? new Date(ts * 1000).toLocaleString() : 'N/A';
        };

        const stateMap = ["Initiated", "Funded", "Shipped", "Verified", "Completed", "Refunded"];
        const stateLabel = stateMap[Number(state)];
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let y = 20;
        doc.setFontSize(18);
        doc.text("Letter of Credit Summary", 20, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Contract Address: ${loc.address}`, 20, y);
        y += 10;
        doc.text(`Status: ${stateLabel}`, 20, y);

        // Divider
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;

        // Section: Parties
        doc.setFont("helvetica", "bold");
        doc.text("Parties Involved", 20, y);
        doc.setFont("helvetica", "normal");
        y += 8;
        doc.text(`Buyer: ${buyer}`, 20, y);
        y += 6;
        doc.text(`Seller: ${seller}`, 20, y);
        y += 6;
        doc.text(`Arbiter (Bank): ${arbiter}`, 20, y);

        // Divider
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;

        // Section: Financials
        doc.setFont("helvetica", "bold");
        doc.text("Financials", 20, y);
        doc.setFont("helvetica", "normal");
        y += 8;
        doc.text(`Amount: ${ethers.utils.formatEther(amount)} ETH`, 20, y);

        // Divider
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;

        // Section: Timeline
        doc.setFont("helvetica", "bold");
        doc.text("Timeline", 20, y);
        doc.setFont("helvetica", "normal");
        y += 8;
        doc.text(`Created At: ${formatDate(createdAt)}`, 20, y);
        y += 6;
        doc.text(`Funds Deposited At: ${formatDate(fundsDepositedAt)}`, 20, y);
        y += 6;
        doc.text(`Shipment Confirmed At: ${formatDate(shipmentConfirmedAt)}`, 20, y);
        y += 6;
        doc.text(`Documents Verified At: ${formatDate(documentsVerifiedAt)}`, 20, y);
        y += 6;
        doc.text(`Payment Released At: ${formatDate(paymentReleasedAt)}`, 20, y);
        y += 6;
        doc.text(`Refund Processed At: ${formatDate(refundProcessedAt)}`, 20, y);

        // Divider
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;

        // Section: Deadlines
        doc.setFont("helvetica", "bold");
        doc.text("Deadlines", 20, y);
        doc.setFont("helvetica", "normal");
        y += 8;
        doc.text(`Shipment Deadline: ${formatDate(shipmentDeadline)}`, 20, y);
        y += 6;
        doc.text(`Verification Deadline: ${formatDate(verificationDeadline)}`, 20, y);

        // Footer
        y += 15;
        doc.setFontSize(10);
        doc.text("Generated by G-LOC Decentralized Trade Finance App", 20, y);

        doc.save(`LOC-${loc.address.slice(0, 6)}.pdf`);
        console.log("PDF downloaded successfully");
        alert("PDF downloaded successfully!");
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
    new PageNavigator();
    new LetterOfCreditApp();
}); 