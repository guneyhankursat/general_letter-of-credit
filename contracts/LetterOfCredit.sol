// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract LetterOfCredit is ReentrancyGuard {
    using Address for address payable;

    // Roles
    address public buyer;
    address public seller;
    address public arbiter;

    // State machine
    enum LoCState { Initiated, Funded, Shipped, Verified, Completed, Refunded }
    LoCState public currentState;

    // Financials
    uint256 public amount;
    uint256 public shipmentDeadline;        // Deadline for seller to confirm shipment
    uint256 public verificationDeadline;    // Deadline for arbiter to verify documents after shipment

    // Timestamps
    uint256 public createdAt;
    uint256 public fundsDepositedAt;
    uint256 public shipmentConfirmedAt;
    uint256 public documentsVerifiedAt;
    uint256 public paymentReleasedAt;
    uint256 public refundProcessedAt;

    // Events
    event FundsDeposited(address indexed buyer, uint256 amount, uint256 timestamp);
    event ShipmentConfirmed(address indexed seller, uint256 timestamp);
    event DocumentsVerified(address indexed arbiter, uint256 timestamp);
    event PaymentReleased(address indexed seller, uint256 amount, uint256 timestamp);
    event BuyerRefunded(address indexed buyer, uint256 amount, uint256 timestamp);
    event StateChanged(LoCState newState, uint256 timestamp);

    // Modifiers
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter can call this");
        _;
    }

    modifier inState(LoCState expectedState) {
        require(currentState == expectedState, "Invalid state for this action");
        _;
    }

    constructor(
        address _buyer,
        address _seller,
        address _arbiter,
        uint256 _shipmentDeadlineDays,
        uint256 _verificationDeadlineDays
    ) {
        require(_seller != address(0), "Invalid seller address");
        require(_arbiter != address(0), "Invalid arbiter address");
        require(_shipmentDeadlineDays > 0 && _shipmentDeadlineDays <= 365, "Invalid shipment deadline");
        require(_verificationDeadlineDays > 0 && _verificationDeadlineDays <= 90, "Invalid verification window");

        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;

        createdAt = block.timestamp;
        shipmentDeadline = block.timestamp + (_shipmentDeadlineDays * 1 days);
        verificationDeadline = shipmentDeadline + (_verificationDeadlineDays * 1 days);

        currentState = LoCState.Initiated;
        emit StateChanged(currentState, block.timestamp);
    }

    // Buyer deposits funds
    function depositFunds() external payable onlyBuyer inState(LoCState.Initiated) nonReentrant {
        require(msg.value > 0, "Must deposit funds");
        require(amount == 0, "Funds already deposited");

        amount = msg.value;
        fundsDepositedAt = block.timestamp;
        currentState = LoCState.Funded;

        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
        emit StateChanged(currentState, block.timestamp);
    }

    // Seller confirms shipment
    function confirmShipment() external onlySeller inState(LoCState.Funded) {
        require(block.timestamp <= shipmentDeadline, "Shipment deadline passed");

        shipmentConfirmedAt = block.timestamp;
        currentState = LoCState.Shipped;

        emit ShipmentConfirmed(msg.sender, block.timestamp);
        emit StateChanged(currentState, block.timestamp);
    }

    // Arbiter verifies documents
    function verifyDocuments() external onlyArbiter inState(LoCState.Shipped) {
        require(block.timestamp <= verificationDeadline, "Verification deadline passed");

        documentsVerifiedAt = block.timestamp;
        currentState = LoCState.Verified;

        emit DocumentsVerified(msg.sender, block.timestamp);
        emit StateChanged(currentState, block.timestamp);
    }

    // Release payment to seller
    function releasePayment() external inState(LoCState.Verified) nonReentrant {
        require(address(this).balance >= amount, "Insufficient contract balance");

        paymentReleasedAt = block.timestamp;
        currentState = LoCState.Completed;

        payable(seller).sendValue(amount);

        emit PaymentReleased(seller, amount, block.timestamp);
        emit StateChanged(currentState, block.timestamp);
    }

    // Refund buyer if shipment not confirmed or verification failed
    function refundBuyer() external onlyBuyer nonReentrant {
        require(
            (currentState == LoCState.Funded && block.timestamp > shipmentDeadline) ||
            (currentState == LoCState.Shipped && block.timestamp > verificationDeadline),
            "Refund not allowed yet"
        );

        refundProcessedAt = block.timestamp;
        currentState = LoCState.Refunded;

        payable(buyer).sendValue(amount);

        emit BuyerRefunded(buyer, amount, block.timestamp);
        emit StateChanged(currentState, block.timestamp);
    }

    // Helper function for frontend and PDF generation
    function getContractDetails()
        external
        view
        returns (
            address _buyer,
            address _seller,
            address _arbiter,
            uint256 _amount,
            LoCState _state,
            uint256 _createdAt,
            uint256 _fundsDepositedAt,
            uint256 _shipmentConfirmedAt,
            uint256 _documentsVerifiedAt,
            uint256 _paymentReleasedAt,
            uint256 _refundProcessedAt,
            uint256 _shipmentDeadline,
            uint256 _verificationDeadline
        )
    {
        return (
            buyer,
            seller,
            arbiter,
            amount,
            currentState,
            createdAt,
            fundsDepositedAt,
            shipmentConfirmedAt,
            documentsVerifiedAt,
            paymentReleasedAt,
            refundProcessedAt,
            shipmentDeadline,
            verificationDeadline
        );
    }
}
