import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")


const { POLYGON_MUMBAI_RPC_PROVIDER, PRIVATE_KEY, POLYGONSCAN_API_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
};

module.exports = {
  networks: {
    hardhat: {
    },
    mumbai:{
      chainId:80001,
      accounts: [PRIVATE_KEY],
      thrownOnCallFailures:true,
      thrownOnTransactionFailures:true,
      allowUnlimitedContractSize: true,
      url:POLYGON_MUMBAI_RPC_PROVIDER
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },
  sourcify: {
    enabled: true,
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
