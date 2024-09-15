const { artifacts, ethers, upgrades } = require("hardhat");

const deploySettings = require("./deploySettings");
const { getChain } = require("../utils/chainsHelper");
const deployContract = require("../utils/deployContract");
const deployUpgradableContract = require("../utils/deployUpgradableContract");
const getNamedSigners = require("../utils/getNamedSigners");
const readFromConfig = require("../utils/readFromConfig");
const saveToConfig = require("../utils/saveToConfig");
const verifyUpgradableContract = require("../utils/verifyUpgradableContract");

const getDeployHelpers = async () => {
  const chainId = 100010;
  const CHAIN_NAME = getChain(chainId).name;
  const { payDeployer } = await getNamedSigners();
  return { chainId, CHAIN_NAME, payDeployer };
};

async function main() {
  const deployHelpers = await getDeployHelpers();
  const owner = deploySettings["COMMON"].OWNER_ADDRESS;
  const deployedAddress = await deployUpgradableContract(
    hre,
    deployHelpers.chainId,
    "VeCycle",
    deployHelpers.payDeployer,
    [owner, owner, owner, 1, "0x61916408e74b0d4ba02d4d83367003583c37caaf"],
  );

  await verifyUpgradableContract(
    hre,
    "contracts/VeCycle.sol:VeCycle",
    deployedAddress,
    deployHelpers.chainId,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
