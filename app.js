// Contract configuration
const CONTRACT_ADDRESS = "0x77c503B101Edd5D08Cb2B092f9A5aA3Fc5AEFfFC";
const LOC_CONTRACT_ADDRESS = "0x85Fe30fcA2D624CCA9C0907b2C8e2A90D336fEB9";

// Load ABI from the JSON file
let CONTRACT_ABI = [];
let LOC_CONTRACT_ABI = [];

// Infura token for IPFS uploads
// const INFURA_PROJECT_ID = "eed037ae31bc401cb5104294f04d1163";
// const INFURA_PROJECT_SECRET = "zBgxwmYJsOymp7WAr97AbWtkJc+66NkMJvC8+ay0Tv6EtSLdL6q2fw";
// const INFURA_AUTH = "Basic " + btoa(INFURA_PROJECT_ID + ":" + INFURA_PROJECT_SECRET);

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
        window.location.hash = pageId;
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

        window.location.hash = pageId;
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
                // const docCid = await loc.documentHash();
                loc.role = role;
                loc.details = details;
                loc.addr = addr;
                // loc.docCid = docCid;
                console.log("loc address:", addr);
                console.log("role:", role);
                console.log("tracking details:", details[5]);
                // console.log("document CID:", docCid);
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
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const sellerName = document.getElementById('sellerName').value;
            const bankName = document.getElementById('bankName').value;
            const goodsDescription = document.getElementById('goodsDescription').value;
            const weightKg = document.getElementById('weightKg').value;
            const agreedAmountEth = document.getElementById('agreedAmount').value;
            const agreedAmountWei = ethers.utils.parseEther(agreedAmountEth.toString());

            if (!seller || !arbiter || !shipmentDeadline || !verificationDeadline || !title || !description || !agreedAmountEth) {
                this.showError('Please fill in all fields');
                return;
            }
            const factory = new ethers.Contract(LOC_CONTRACT_ADDRESS, LOC_CONTRACT_ABI, this.signer);
            const tx = await factory.createLoC(
                this.userAddress,
                seller, 
                arbiter,
                shipmentDeadline, 
                verificationDeadline,
                title,
                description,
                sellerName,
                bankName,
                goodsDescription,
                weightKg,
                agreedAmountWei
            );
            this.showStatus('Creating Letter of Credit...');
            await tx.wait();
            this.showSuccess('Letter of Credit created successfully!');
            ['sellerAddress','arbiterAddress','shipmentDeadline','verificationDeadline',
            'title','description','sellerName','bankName','goodsDescription','weightKg'
            ].forEach(id => document.getElementById(id).value = '');

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
                case "setTrackingNumber": {
                    const tracking = prompt("Enter tracking number:");
                    if (!tracking) {
                        this.showError('Tracking number cannot be empty');
                        return;
                    }
                    const courier = prompt("Enter courier name (optional, e.g., DHL/UPS/FedEx):") || "";
                    this.showStatus('Setting tracking number...');
                    tx = await loc.setTrackingNumber(tracking.trim(), courier.trim());
                    break;
                }
                default:
                    alert("Invalid action");
                    return;
            }
            console.log("Waiting for transaction confirmation...");
            await tx.wait();
            this.showSuccess(`${action} successfull!`);
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
            const trackingNumber = loc.details[5] || "N/A";
            const courierHint = loc.details[6] || "N/A";
            const title = await loc.title();
            const card = document.createElement("div");
            card.className = "card p-4";
            card.innerHTML = `
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Contract Address:</strong> ${loc.address}</p>
                <p><strong>Role in LoC:</strong> ${loc.role}</p>
                <p><strong>Status:</strong> ${statusText}</p>
                <p><strong>Amount:</strong> ${amountText} ETH</p>
            `;
            //action buttons
            // Show tracking
            if (trackingNumber && Number(loc.details[4]) === 2) {
                const p = document.createElement("p");
                p.innerHTML = `<strong>Tracking:</strong> ${trackingNumber} ${courierHint ? `(${courierHint})` : ""}`;
                card.appendChild(p);

                const trackBtn = document.createElement("a");
                trackBtn.textContent = "Track Shipment";
                trackBtn.href = this.buildTrackingLink(trackingNumber);
                trackBtn.target = "_blank";
                trackBtn.className = "btn-primary px-4 py-2 rounded-lg";
                card.appendChild(trackBtn);
            }
            // if (loc.docCid) {
            //     const p = document.createElement("p");
            //     p.innerHTML = `<strong>Document CID:</strong> ${loc.docCid}`;
            //     card.appendChild(p);

            //     const viewBtn = document.createElement("a");
            //     viewBtn.textContent = "View Document";
            //     viewBtn.href = this.buildIpfsLink(loc.docCid);
            //     viewBtn.target = "_blank";
            //     viewBtn.className = "btn-secondary inline-block mt-2 px-3 py-2 rounded-lg";
            //     card.appendChild(viewBtn);
            // }
            if (loc.role === "Buyer" && Number(loc.details[4]) === 0) {
                const btn = document.createElement("button");
                btn.textContent = "Deposit";
                btn.id = "depositFunds";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "depositFunds"));
                card.appendChild(btn);
            }
            // === Seller: set tracking number in Shipped (1) 

            if (loc.role === "Seller" && Number(loc.details[4]) === 1) {
                // Always show Set Tracking button
                const setTrackBtn = document.createElement("button");
                setTrackBtn.textContent = "Set Tracking Number";
                setTrackBtn.className = "btn-primary px-4 py-2 rounded-lg mr-2";
                setTrackBtn.addEventListener("click", () => this.setTrackingNumber(loc));
                card.appendChild(setTrackBtn);

                // const uploadBtn = document.createElement("button");
                // uploadBtn.textContent = "Upload Verification Document";
                // uploadBtn.className = "btn-primary px-4 py-2 rounded-lg mr-2";
                // uploadBtn.addEventListener("click", () => this.uploadDocForVerification(loc));
                // card.appendChild(uploadBtn);

                // Confirm Shipment button — disabled until tracking and documents exists
                const confirmBtn = document.createElement("button");
                confirmBtn.textContent = "Confirm Shipment";
                confirmBtn.id = "confirmShipment";
                confirmBtn.className = "btn-primary px-4 py-2 rounded-lg";
                confirmBtn.disabled = (!loc.details[5]); // Disable if no tracking number
                confirmBtn.style.opacity = confirmBtn.disabled ? "0.6" : "1.0";
                confirmBtn.title = confirmBtn.disabled ? "Set a tracking number first" : "";
                confirmBtn.addEventListener("click", () => {
                    if (!loc.trackingNumber) {
                        this.showWarning("Please set a tracking number before confirming shipment.");
                        return;
                    }
                    this.handleAction(loc, "confirmShipment");
                });
                card.appendChild(confirmBtn);

                // Tiny hint
                const hint = document.createElement("div");
                hint.className = "text-sm opacity-80 mt-2";
                hint.textContent = "A valid tracking number is required to proceed.";
                card.appendChild(hint);
            }
            // === Bank: verify documents in Shipped (2)
            if (loc.role === "Bank" && Number(loc.details[4]) === 2) {
                const btn = document.createElement("button");
                btn.textContent = "Verify Documents";
                btn.id = "verifyDocuments";
                btn.className = "btn-primary px-4 py-2 rounded-lg";
                btn.addEventListener("click", () => this.handleAction(loc, "verifyDocuments"));
                card.appendChild(btn);
            }
            // === Bank: encourage checking tracking/doc before verifying in Shipped (2)
            if (loc.role === "Bank" && Number(loc.details[4]) === 2) {
                const note = document.createElement("div");
                note.className = "mt-2 text-sm opacity-80";
                note.textContent = "Review the shipment tracking before verifying.";
                card.appendChild(note);
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
        trackingNum,
        courierHint,
        createdAt,
        fundsDepositedAt,
        shipmentConfirmedAt,
        documentsVerifiedAt,
        paymentReleasedAt,
        refundProcessedAt,
        shipmentDeadline,
        verificationDeadline
        ] = loc.details;

        let title = "", description = "", sellerName = "", bankName = "",
        goodsDescription = "", weightKg = "";
        try { title = await loc.title(); } catch {}
        try { description = await loc.description(); } catch {}
        try { sellerName = await loc.sellerName(); } catch {}
        try { bankName = await loc.bankName(); } catch {}
        try { goodsDescription = await loc.goodsDescription(); } catch {}
        try { weightKg = await loc.weightKg(); } catch {}


        const formatDate = (timestamp) => {
        const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
        return ts > 0 ? new Date(ts * 1000).toLocaleString() : 'N/A';
        };

        const stateMap = ["Initiated", "Funded", "Shipped", "Verified", "Completed", "Refunded"];
        const stateLabel = stateMap[Number(state)];
        // let docCid = loc.docCid || "";
        // if (!docCid && typeof loc.documentHash === "function") {
        //     try { docCid = await loc.documentHash(); } catch {}
        // }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;
        // ===== Logo (optional: replace with your actual logo URL/Base64) =====
        // Example Base64 placeholder: a small transparent pixel
        const logoUrl = "logo.jfif";
        const logoImg = await fetch(logoUrl).then(r => r.blob()).then(b => new Promise(res => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(b);
        }));
        doc.addImage(logoImg, "PNG", 160, 10, 30, 30);

        // ===== Header =====
        doc.setFontSize(20).setFont("helvetica", "bold");
        doc.text("Letter of Credit", 20, y);
        y += 10;

        doc.setFontSize(12).setFont("helvetica", "normal");
        doc.text(`Contract Address: ${loc.address}`, 20, y);
        y += 6;
        doc.text(`Status: ${stateLabel}`, 20, y);
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;

        // ===== Contract Overview =====
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("Contract Overview", 20, y);
        y += 8;

        doc.setFont("helvetica", "normal").setFontSize(12);
        doc.text(`Title: ${title || "N/A"}`, 20, y); y += 6;
        doc.text(`Description: ${description || "N/A"}`, 20, y); y += 8;
        doc.line(20, y, 190, y);
        y += 10;
        // Section: Parties
        // ===== Parties =====
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("Parties Involved", 20, y); y += 8;
        doc.setFont("helvetica", "normal").setFontSize(12);
        doc.text(`Buyer Address: ${buyer}`, 20, y); y += 6;
        doc.text(`Seller Name: ${sellerName || "N/A"}`, 20, y); y += 6;
        doc.text(`Seller Address: ${seller}`, 20, y); y += 6;
        doc.text(`Bank Name: ${bankName || "N/A"}`, 20, y); y += 8;
        doc.text(`Bank/Arbiter Address: ${arbiter}`, 20, y); y += 6;
        doc.line(20, y, 190, y);
        y += 10;
        // ===== Goods Info =====
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("Goods & Shipment Details", 20, y); y += 8;
        doc.setFont("helvetica", "normal").setFontSize(12);
        doc.text(`Goods Description: ${goodsDescription || "N/A"}`, 20, y); y += 6;
        doc.text(`Weight: ${weightKg || "N/A"} kg`, 20, y); y += 6;
        doc.text(`Tracking Number: ${trackingNum || 'N/A'}`, 20, y); y += 6;
        doc.text(`Courier: ${courierHint || 'N/A'}`, 20, y); y += 6;
        if (trackingNum) {
            const tUrl = this.buildTrackingLink(trackingNum);
            doc.text(`Tracking URL: ${tUrl}`, 20, y); y += 6;
        }
        // doc.text(`Document CID: ${docCid || 'N/A'}`, 20, y); y += 6;
        // if (docCid) {
        //     const ipfsUrl = `https://ipfs.infura.io/ipfs/${cid}`;
        //     doc.text(`Document URL: ${ipfsUrl}`, 20, y); y += 6;
        // }
        doc.line(20, y, 190, y);
        y += 10;
        // Section: Financials
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("Financials", 20, y);
        doc.setFont("helvetica", "normal").setFontSize(12);
        y += 8;
        let agreedAmountEth = "0.0000";
        try {
            const agreedWei = await loc.agreedAmount();
            agreedAmountEth = parseFloat(ethers.utils.formatEther(agreedWei))
                .toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        } catch {}

        doc.text(`Contract Amount (Agreed): ${agreedAmountEth} ETH`, 20, y); y += 6;
        doc.text(`Amount Deposited: ${ethers.utils.formatEther(amount)} ETH`, 20, y); y += 8;
        doc.line(20, y, 190, y);
        y += 10;

        // Section: Timeline
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("Timeline", 20, y);
        doc.setFont("helvetica", "normal").setFontSize(12);
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
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;
        // Section: Deadlines
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("Deadlines", 20, y);
        doc.setFont("helvetica", "normal").setFontSize(12);
        y += 8;
        doc.text(`Shipment Deadline: ${formatDate(shipmentDeadline)}`, 20, y);
        y += 6;
        doc.text(`Verification Deadline: ${formatDate(verificationDeadline)}`, 20, y);
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;
        // Footer
        y += 5;
        doc.line(20, y, 190, y); y += 10;
        doc.setFont("helvetica", "italic").setFontSize(10);
        doc.text("This Letter of Credit is generated by G-LOC, a decentralized trade finance application.", 20, y);

        doc.save(`LOC-${loc.address.slice(0, 6)}.pdf`);
        console.log("PDF downloaded successfully");
        alert("PDF downloaded successfully!");
    }

    // async uploadToIPFS(file) {
    //     try {
    //         const INFURA_PROJECT_ID = "eed037ae31bc401cb5104294f04d1163";
    //         const INFURA_PROJECT_SECRET = "zBgxwmYJsOymp7WAr97AbWtkJc+66NkMJvC8+ay0Tv6EtSLdL6q2fw";
    //         const INFURA_AUTH = "Basic " + btoa(INFURA_PROJECT_ID + ":" + INFURA_PROJECT_SECRET);
    //         const formData = new FormData();
    //         formData.append("file", file);

    //         const res = await fetch("https://ipfs.infura.io:5001/api/v0/add", {
    //             method: "POST",
    //             // headers: {
    //             //     Authorization: `Basic ${btoa(INFURA_PROJECT_ID + ":" + INFURA_PROJECT_SECRET)}`
    //             // },
    //             headers: {
    //                     Authorization: `Basic ${btoa(INFURA_PROJECT_ID + ":" + INFURA_PROJECT_SECRET)}`
    //             },
    //             body: formData
    //         });

    //         if (!res.ok) {
    //             throw new Error(`Infura IPFS upload failed: ${res.statusText}`);
    //         }

    //         const data = await res.json();
    //         const cid = data.Hash;
    //         return cid; // Only CID; we'll build full gateway link separately
    //     } catch (err) {
    //         console.error("IPFS Upload Error:", err);
    //         throw err;
    //     }
    // }

    // async uploadDocForVerification(loc) {
    //     try {
    //         const input = document.createElement("input");
    //         input.type = "file";
    //         input.accept = ".pdf,.png,.jpg,.jpeg,.webp,.txt"; // adjust as needed

    //         input.onchange = async () => {
    //             const file = input.files?.[0];
    //             if (!file) return;
    //             this.showStatus("Uploading to Infura IPFS...");
                
    //             const cid = await this.uploadToIPFS(file);
    //             const ipfsUrl = `https://ipfs.infura.io/ipfs/${cid}`;
                
    //             this.showStatus(`CID: ${cid} — saving to blockchain...`);

    //             const tx = await loc.uploadVerificationDocument(cid);
    //             await tx.wait();
                
    //             this.showSuccess(`Document saved! View: ${ipfsUrl}`);
    //             await this.updateAndRenderLocs();
    //         };

    //         input.click();
    //     } catch (err) {
    //         this.showError(`Upload failed: ${err.message}`);
    //     }
    // }

    // Store tracking number on-chain
    async setTrackingNumber(loc) {
        try {
            const tracking = prompt("Enter tracking number:");
            if (!tracking) return;

            const courier = prompt("Enter courier name (optional, e.g., DHL/UPS/FedEx):") || "";
            const tx = await loc.setTrackingNumber(tracking.trim(), courier.trim());
            this.showStatus('Setting tracking number...');
            await tx.wait();
            this.showSuccess('Tracking number saved!');
            await this.updateAndRenderLocs();
        } catch (err) {
            this.showError(`Failed to set tracking: ${err.message}`);
        }
    }

    // universal tracking link (works with many couriers)
    // 17track.net is a popular universal tracking service
    // It supports many couriers and provides a single link format
    buildTrackingLink(trackingNumber) {
        return `https://www.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`;
    }

    // Convenience: IPFS gateway link
    // buildIpfsLink(cid) {
    //     return `https://ipfs.io/ipfs/${cid}`;
    // }


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