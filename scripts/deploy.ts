import { ethers } from "hardhat";

async function main() {


  const Token = await ethers.getContractFactory("Bite");
  const token = await Token.deploy("10000000000000000000000"); // 10,000 tokens


  const MyCrowdsale = await ethers.getContractFactory("MyCrowdsale");
  const myCrowdsale = await MyCrowdsale.deploy(token.getAddress());

  await token.transfer(myCrowdsale.getAddress(), "10000000000000000000000");

  console.log(
    `deployed to ${token.target}`
  );
  console.log(
      `deployed crowdsale to ${myCrowdsale.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
