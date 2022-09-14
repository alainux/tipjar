require('@nomiclabs/hardhat-waffle')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: './src/artifacts',
    sources: './src/contracts'
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    goerli: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.ALCHEMY_PRIVATE_KEY]
    }
  }
};
