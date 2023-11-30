// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Counter {
    uint256 private count = 0;

    function getCount() public view returns(uint256) {
        return count;
    }

    function increment() public {
        count ++;
    }

    function decrement() public {
        require(count > 0, 'Cannot be negative');
        count --;
    }

    function reset() public{
        count = 0;
    }
}
