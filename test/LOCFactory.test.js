const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isAddress } = require("ethers");

describe("LOCFactory → LetterOfCredit integration", function () {
  let LOCFactory, LetterOfCredit;
  let factory, locImpl;
  let buyer, seller, bank;

  beforeEach(async function () {
    [buyer, seller, bank] = await ethers.getSigners();

    LetterOfCredit = await ethers.getContractFactory("LetterOfCredit");

    // Deploy LOCFactory
    LOCFactory = await ethers.getContractFactory("LoCFactory");
    console.log("Deploying contract...");
    factory = await LOCFactory.deploy();
    console.log("Waiting for contract to deployed...");
    await factory.waitForDeployment();
    console.log("Contract address");

  });

  it("should deploy a new LoC via factory and set correct roles", async function () {
    const tx = await factory.createLoC(buyer.address, seller.address, bank.address, 7, 14);
    const receipt = await tx.wait();

    const events = await factory.queryFilter("LoCCreated", receipt.blockNumber, receipt.blockNumber);
    expect(events.length).to.be.greaterThan(0);
    console.log("Events found:", events);
    const locAddress = events[0].args[3];
    console.log("locAddress:", locAddress);

    expect(isAddress(locAddress)).to.be.true;

    const [buyerAddr, sellerAddr, bankAddr, address] = events[0].args;
    expect(buyerAddr).to.equal(buyer.address);
    expect(sellerAddr).to.equal(seller.address);
    expect(bankAddr).to.equal(bank.address);

  });

  it("should track LoC address under the user's contract list", async function () {
    const tx = await factory.createLoC(buyer.address, seller.address, bank.address, 7, 14);
    const receipt = await tx.wait();
    const events = await factory.queryFilter("LoCCreated", receipt.blockNumber, receipt.blockNumber);
    expect(events.length).to.be.greaterThan(0);
    const locAddress = events[0].args[3];

    const userLocs = await factory.getContractsForUser(buyer.address);
    console.log("User LOCs:", userLocs);
    expect(userLocs.length).to.be.greaterThan(0);
    expect(userLocs).to.include(locAddress);

    const userRole = await factory.getUserRoleInContract(seller.address, locAddress);
    console.log("User role in LOC:", userRole);
  });
});
