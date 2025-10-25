import hre from "hardhat";

async function main() {
  const EventSenseStorage = await hre.ethers.getContractFactory("EventSenseStorage");
  const contract = await EventSenseStorage.deploy();
  await contract.deployed();

  console.log("EventSenseStorage deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
