// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyCrowdsale is Ownable{
    IERC20 public token;
    uint256 public end;
    uint256 public goal;
    mapping(address => uint256) public contributions;


    event ContributionReceived(address contributor, uint256 amount);

    constructor(address _token, uint256 _duration, uint256 _goal) Ownable(msg.sender){
        token = IERC20(_token);
        end = block.timestamp + _duration;
        goal = _goal;
    }

    function contribute(uint256 amount) external payable {
        require(block.timestamp < end, "Crowdfunding has ended");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        contributions[msg.sender] += amount;
        emit ContributionReceived(msg.sender, amount);
    }

    function withdraw() public onlyOwner {
        require(block.timestamp >= end, "Crowdsale not ended");
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawUnsoldTokens() public onlyOwner {
        require(block.timestamp >= end, "Crowdsale not yet finished");

        uint256 remainingTokens = token.balanceOf(address(this));
        require(remainingTokens > 0, "No unsold tokens available");

        token.transfer(owner(), remainingTokens);
    }

    function refund() external {
        require(block.timestamp >= end, "Crowdfunding not ended");
        require(token.balanceOf(address(this)) < goal, "Goal reached");
        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0;
        token.transfer(msg.sender, amount);
    }

}
