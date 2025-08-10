const hre = require("hardhat");

async function main() {
  const LOCFactory = await hre.ethers.getContractFactory("LoCFactory");
  const locFactory = await LOCFactory.deploy();

  await locFactory.waitForDeployment();
  
  const contractAddress = await locFactory.getAddress();
  console.log(`LOCFactory deployed to:`, contractAddress);
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
    path.join(__dirname, '../factory-contract-address.json'),
    JSON.stringify(addressData, null, 2)
  );

  // Export contract ABI
  const contractArtifact = await hre.artifacts.readArtifact("LoCFactory");
  fs.writeFileSync(
    path.join(__dirname, '../factory-contract-abi.json'),
    JSON.stringify(contractArtifact.abi, null, 2)
  );

  console.log("Contract address and ABI exported to:");
  console.log("- factory-contract-address.json");
  console.log("- factory-contract-abi.json");

  return contractAddress;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
