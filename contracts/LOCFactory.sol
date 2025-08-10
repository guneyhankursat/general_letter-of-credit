// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LetterOfCredit.sol";

contract LoCFactory {
    address[] public allLoCs;
    mapping(address => address[]) public userToContracts;

    event LoCCreated(address indexed buyer, address indexed seller, address indexed arbiter, address contractAddress);

    function createLoC(
        address _buyer,
        address _seller,
        address _arbiter,
        uint256 _shipmentDeadlineDays,
        uint256 _verificationDeadlineDays
    ) external returns (address) {
        LetterOfCredit newLoC = new LetterOfCredit(_buyer, _seller, _arbiter, _shipmentDeadlineDays, _verificationDeadlineDays);
        allLoCs.push(address(newLoC));
        
        userToContracts[msg.sender].push(address(newLoC));
        userToContracts[_seller].push(address(newLoC));
        userToContracts[_arbiter].push(address(newLoC));

        emit LoCCreated(msg.sender, _seller, _arbiter, address(newLoC));

        return address(newLoC);
    }

    function getContractsForUser(address user) external view returns (address[] memory) {
        return userToContracts[user];
    }

    function getAllLoCs() external view returns (address[] memory) {
        return allLoCs;
    }

    function getUserRoleInContract(address user, address loc) external view returns (string memory) {
        LetterOfCredit locContract = LetterOfCredit(loc);
        (address buyer, address seller, address arbiter,,,,,,,,,,) = locContract.getContractDetails();
        if (user == buyer) return "Buyer";
        if (user == seller) return "Seller";
        if (user == arbiter) return "Bank";
        return "Unknown";
    }
}
