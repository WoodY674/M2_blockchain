// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyCrowdsale {
    IERC20 public token;
    address public owner;
    mapping(address => uint256) public contributions;

    event ContributionReceived(address contributor, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
    }
}
