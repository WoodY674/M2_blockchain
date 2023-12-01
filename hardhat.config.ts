import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config()

const config: HardhatUserConfig = {
  solidity: "0.8.20",
};

module.exports = {
  networks: {
    hardhat: {
    },
    mumbai:{
      chainId:80001,
      accounts: [process.env.PRIVATE_KEY],
      thrownOnCallFailures:true,
      thrownOnTransactionFailures:true,
      allowUnlimitedContractSize: true,
      url:`https://rpc-mumbai.maticvigil.com`
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
}




export default config;
