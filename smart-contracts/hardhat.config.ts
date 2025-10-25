require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    bnbTestnet: {
      url: process.env.BNB_TESTNET_RPC,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
};
