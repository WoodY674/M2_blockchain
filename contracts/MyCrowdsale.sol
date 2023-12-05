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

    uint256 public releaseTime;


    event ContributionReceived(address contributor, uint256 amount);

    event TokensWithdrawn(address contributor, uint256 amount);

    constructor(address _token, uint256 _duration, uint256 _goal) Ownable(msg.sender){
        token = IERC20(_token);
        end = block.timestamp + _duration;
        goal = _goal;
        releaseTime = block.timestamp + _duration * 2;
    }

    function contribute() external payable {
        require(block.timestamp < end, "Crowdfunding has ended");

        contributions[msg.sender] += msg.value;
        emit ContributionReceived(msg.sender, msg.value);
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

    function withdrawTokens() public {
        require(block.timestamp >= releaseTime, "Tokens are still locked");
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "No tokens to withdraw");

        contributions[msg.sender] = 0;
        token.transfer(msg.sender, amount);
        emit TokensWithdrawn(msg.sender, amount);
    }

}
