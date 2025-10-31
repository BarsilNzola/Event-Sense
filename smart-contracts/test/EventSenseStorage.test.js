const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventSenseStorage", function () {
  let eventSenseStorage;
  let owner, user1, user2;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contract
    const EventSenseStorage = await ethers.getContractFactory("EventSenseStorage");
    eventSenseStorage = await EventSenseStorage.deploy();
    await eventSenseStorage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully and have correct initial state", async function () {
      const address = await eventSenseStorage.getAddress();
      expect(ethers.isAddress(address)).to.be.true;
      
      const totalSummaries = await eventSenseStorage.totalSummaries();
      expect(totalSummaries).to.equal(0);
    });
  });

  describe("Store Summary", function () {
    it("Should store a summary and emit event", async function () {
      const testCID = "QmTestCID123456789";
      
      // Store summary and check event
      await expect(eventSenseStorage.connect(user1).storeSummary(testCID))
        .to.emit(eventSenseStorage, "SummaryStored")
        .withArgs(user1.address, testCID, await getCurrentTimestamp());

      // Verify storage
      const total = await eventSenseStorage.totalSummaries();
      expect(total).to.equal(1);
      
      const summary = await eventSenseStorage.getSummary(0);
      expect(summary.cid).to.equal(testCID);
      expect(summary.author).to.equal(user1.address);
      expect(summary.timestamp).to.be.gt(0);
    });

    it("Should store multiple summaries from different users", async function () {
      const cid1 = "QmFirstCID123456789";
      const cid2 = "QmSecondCID987654321";

      // User1 stores first summary
      await eventSenseStorage.connect(user1).storeSummary(cid1);
      
      // User2 stores second summary
      await eventSenseStorage.connect(user2).storeSummary(cid2);

      // Verify both summaries
      expect(await eventSenseStorage.totalSummaries()).to.equal(2);

      const summary1 = await eventSenseStorage.getSummary(0);
      const summary2 = await eventSenseStorage.getSummary(1);

      expect(summary1.cid).to.equal(cid1);
      expect(summary1.author).to.equal(user1.address);

      expect(summary2.cid).to.equal(cid2);
      expect(summary2.author).to.equal(user2.address);

      // Verify timestamps are different (or at least valid)
      expect(summary2.timestamp).to.be.gte(summary1.timestamp);
    });

    it("Should handle empty CID string", async function () {
      const emptyCID = "";
      
      await expect(eventSenseStorage.connect(user1).storeSummary(emptyCID))
        .to.emit(eventSenseStorage, "SummaryStored")
        .withArgs(user1.address, emptyCID, await getCurrentTimestamp());

      const summary = await eventSenseStorage.getSummary(0);
      expect(summary.cid).to.equal("");
      expect(summary.author).to.equal(user1.address);
    });
  });

  describe("Get Summary", function () {
    beforeEach(async function () {
      // Add some test data
      await eventSenseStorage.connect(user1).storeSummary("QmTest1");
      await eventSenseStorage.connect(user2).storeSummary("QmTest2");
    });

    it("Should retrieve stored summaries correctly", async function () {
      const summary0 = await eventSenseStorage.getSummary(0);
      const summary1 = await eventSenseStorage.getSummary(1);

      expect(summary0.cid).to.equal("QmTest1");
      expect(summary0.author).to.equal(user1.address);

      expect(summary1.cid).to.equal("QmTest2");
      expect(summary1.author).to.equal(user2.address);
    });

    it("Should revert when accessing out-of-bounds index", async function () {
      // Should revert for index 2 since we only have 2 items
      await expect(eventSenseStorage.getSummary(2)).to.be.reverted;
      
      // Should revert for any index when array is empty in fresh contract
      const newContract = await (await ethers.getContractFactory("EventSenseStorage")).deploy();
      await expect(newContract.getSummary(0)).to.be.reverted;
    });
  });

  describe("Total Summaries", function () {
    it("Should return correct count", async function () {
      expect(await eventSenseStorage.totalSummaries()).to.equal(0);

      await eventSenseStorage.connect(user1).storeSummary("QmFirst");
      expect(await eventSenseStorage.totalSummaries()).to.equal(1);

      await eventSenseStorage.connect(user2).storeSummary("QmSecond");
      expect(await eventSenseStorage.totalSummaries()).to.equal(2);

      await eventSenseStorage.connect(owner).storeSummary("QmThird");
      expect(await eventSenseStorage.totalSummaries()).to.equal(3);
    });
  });

  describe("Public summaries array", function () {
    it("Should access summary through public array mapping", async function () {
      const testCID = "QmPublicArrayTest";
      await eventSenseStorage.connect(user1).storeSummary(testCID);

      const summary = await eventSenseStorage.summaries(0);
      
      expect(summary.cid).to.equal(testCID);
      expect(summary.author).to.equal(user1.address);
      expect(summary.timestamp).to.be.gt(0);
    });
  });

  describe("Event emission", function () {
    it("Should emit event with correct parameters", async function () {
      const testCID = "QmEventTestCID";
      const tx = await eventSenseStorage.connect(user1).storeSummary(testCID);
      const receipt = await tx.wait();

      // Find the event in transaction receipt
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = eventSenseStorage.interface.parseLog(log);
          return parsedLog.name === "SummaryStored";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = eventSenseStorage.interface.parseLog(event);
      expect(parsedEvent.args.author).to.equal(user1.address);
      expect(parsedEvent.args.cid).to.equal(testCID);
      expect(parsedEvent.args.timestamp).to.be.gt(0);
    });
  });
});

// Helper function to get approximate current timestamp
async function getCurrentTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}