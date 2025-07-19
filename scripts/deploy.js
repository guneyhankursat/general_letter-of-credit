require('dotenv').config();
const hre = require("hardhat");

async function main() {
  console.log("Deploying LetterOfCredit contract...");

  // Get the contract factory
  const LetterOfCredit = await hre.ethers.getContractFactory("LetterOfCredit");

  // Deploy the contract with constructor parameters
  const seller = process.env.SELLER_ADDRESS || "0x0000000000000000000000000000000000000001";
  const arbiter = process.env.ARBITER_ADDRESS || "0x0000000000000000000000000000000000000002";
  const shipmentDeadlineDays = parseInt(process.env.SHIPMENT_DEADLINE_DAYS) || 30;
  const verificationDeadlineDays = parseInt(process.env.VERIFICATION_DEADLINE_DAYS) || 7;

  const letterOfCredit = await LetterOfCredit.deploy(
    seller,
    arbiter,
    shipmentDeadlineDays,
    verificationDeadlineDays
  );

  await letterOfCredit.waitForDeployment();

  const contractAddress = await letterOfCredit.getAddress();
  console.log("LetterOfCredit deployed to:", contractAddress);

  // Export contract address and ABI
  const fs = require('fs');
  const path = require('path');

  // Export contract address
  const addressData = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, '../contract-address.json'),
    JSON.stringify(addressData, null, 2)
  );

  // Export contract ABI
  const contractArtifact = await hre.artifacts.readArtifact("LetterOfCredit");
  fs.writeFileSync(
    path.join(__dirname, '../contract-abi.json'),
    JSON.stringify(contractArtifact.abi, null, 2)
  );

  console.log("Contract address and ABI exported to:");
  console.log("- contract-address.json");
  console.log("- contract-abi.json");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 