// Contract configuration
export const CONTRACT_ADDRESS = "0xEb19778999c20Df0Dd969Ab4D25Cb123Dd9c00F3";

// Import ABI from the exported file
export let CONTRACT_ABI = [];

// Load ABI when module is imported
fetch('./LetterOfCreditABI.json')
    .then(response => response.json())
    .then(abi => {
        CONTRACT_ABI = abi;
    })
    .catch(error => {
        console.error('Error loading ABI:', error);
    }); 