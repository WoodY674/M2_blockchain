import { ethers } from "hardhat";
import {verifyContract} from "./verify";


async function main() {

  const initialSupply = ethers.parseEther("100") //"10000000000000000000000";

  const Token = await ethers.getContractFactory("Bite");
  const token = await Token.deploy(initialSupply); // 10,000 tokens

  console.log(
      `deployed token to ${token.target}`
  );

  // Wait for 10 confirmations before verifying token on PolygonScan
  await token.deploymentTransaction()?.wait(10)
  await verifyContract(await token.getAddress(),[initialSupply])


  const duration = 600;
  const goal = ethers.parseEther('200');

  const MyCrowdsale = await ethers.getContractFactory("MyCrowdsale");
  const myCrowdsale = await MyCrowdsale.deploy(token.getAddress(), duration, goal);

  await token.transfer(myCrowdsale.getAddress(), initialSupply);

  console.log(
      `deployed crowdsale to ${myCrowdsale.target}`
  );

  // Wait for 5 confirmations before verifying crowdsale on PolygonScan
  await myCrowdsale.deploymentTransaction()?.wait(10)
  await verifyContract(await myCrowdsale.getAddress(),[await token.getAddress(), duration, goal])

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
