import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { readFileSync } from "fs";

// Resolve the root directory (where .env is)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const RPC = process.env.BNB_TESTNET_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!RPC || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.warn("Missing RPC/PRIVATE_KEY/CONTRACT_ADDRESS in .env for chainService");
}

// Read the ABI file directly
const contractPath = path.resolve(__dirname, "../../../smart-contracts/artifacts/contracts/EventSenseStorage.sol/EventSenseStorage.json");
let EventSenseStorageArtifact;
let provider, wallet, contract;

try {
  const artifactContent = readFileSync(contractPath, 'utf8');
  EventSenseStorageArtifact = JSON.parse(artifactContent);
  
  // Initialize provider and contract only if we have the required env vars
  if (RPC && PRIVATE_KEY && CONTRACT_ADDRESS) {
    provider = new JsonRpcProvider(RPC);
    wallet = new Wallet(PRIVATE_KEY, provider);
    contract = new Contract(CONTRACT_ADDRESS, EventSenseStorageArtifact.abi, wallet);
    console.log("Chain service initialized successfully");
  } else {
    console.warn("Chain service: Missing environment variables, blockchain features disabled");
  }
} catch (error) {
  console.error("Failed to initialize chain service:", error.message);
  console.log("Looking for contract at:", contractPath);
}

/**
 * storeCIDOnChain - Store a CID on the blockchain
 * @param {string} cid - the Lighthouse/IPFS CID to store
 * @returns {object} { txHash, receipt, cid, timestamp }
 */
export const storeCIDOnChain = async (cid) => {
  if (!contract) {
    throw new Error("Chain service not initialized - check RPC, PRIVATE_KEY, and CONTRACT_ADDRESS in .env");
  }

  try {
    console.log(`Storing CID on blockchain: ${cid}`);
    
    const tx = await contract.storeSummary(cid);
    console.log("Submitted tx:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Tx mined in block:", receipt.blockNumber);
    console.log("Receipt details:", {
      hash: receipt.hash,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString()
    });
    
    // Get the transaction timestamp from the block
    const block = await provider.getBlock(receipt.blockNumber);
    const timestamp = block.timestamp;
    
    // Use receipt.hash as the primary transaction hash
    const txHash = receipt.hash || receipt.transactionHash;
    
    if (!txHash) {
      console.warn("No transaction hash found in receipt, using tx.hash");
    }
    
    const result = { 
      success: true,
      txHash: txHash || tx.hash, // Fallback to original tx hash
      blockNumber: receipt.blockNumber,
      timestamp: new Date(timestamp * 1000).toISOString(),
      cid,
      gasUsed: receipt.gasUsed?.toString() || '0'
    };

    console.log("Blockchain storage completed:", result);
    return result;
    
  } catch (err) {
    console.error("Error storing CID on chain:", err);
    
    // Provide more detailed error information
    if (err.reason) {
      console.error("Transaction failed reason:", err.reason);
    }
    if (err.code) {
      console.error("Error code:", err.code);
    }
    if (err.transaction) {
      console.error("Transaction details:", err.transaction);
    }
    
    throw err;
  }
};

/**
 * getTotalSummaries - Get the total number of summaries stored
 * @returns {number} Total count of summaries
 */
export const getTotalSummaries = async () => {
  if (!contract) {
    console.warn("Chain service not initialized");
    return 0;
  }

  try {
    const count = await contract.totalSummaries();
    return parseInt(count.toString());
  } catch (err) {
    console.error("Error getting total summaries:", err);
    return 0;
  }
};

/**
 * getSummaryByIndex - Get a specific summary by index
 * @param {number} index - The index of the summary
 * @returns {object} Summary object { cid, author, timestamp }
 */
export const getSummaryByIndex = async (index) => {
  if (!contract) {
    throw new Error("Chain service not initialized");
  }

  try {
    const summary = await contract.getSummary(index);
    return {
      cid: summary.cid,
      author: summary.author,
      timestamp: new Date(parseInt(summary.timestamp.toString()) * 1000).toISOString()
    };
  } catch (err) {
    console.error(`Error getting summary at index ${index}:`, err);
    throw err;
  }
};

/**
 * getAllSummaries - Get all summaries stored in the contract
 * @returns {object[]} Array of summary objects
 */
export const getAllSummaries = async () => {
  if (!contract) {
    console.warn("Chain service not initialized");
    return [];
  }

  try {
    const total = await getTotalSummaries();
    const summaries = [];

    for (let i = 0; i < total; i++) {
      try {
        const summary = await getSummaryByIndex(i);
        summaries.push({
          index: i,
          ...summary
        });
      } catch (err) {
        console.warn(`Could not fetch summary at index ${i}:`, err.message);
        // Continue with next summary
      }
    }

    return summaries;
  } catch (err) {
    console.error("Error getting all summaries:", err);
    return [];
  }
};

/**
 * verifyCIDOnChain - Check if a CID exists in the contract
 * @param {string} cid - The CID to verify
 * @returns {boolean} True if CID exists
 */
export const verifyCIDOnChain = async (cid) => {
  if (!contract) {
    console.warn("Chain service not initialized");
    return false;
  }

  try {
    const total = await getTotalSummaries();
    
    for (let i = 0; i < total; i++) {
      const summary = await getSummaryByIndex(i);
      if (summary.cid === cid) {
        return true;
      }
    }
    
    return false;
  } catch (err) {
    console.error("Error verifying CID on chain:", err);
    return false;
  }
};

/**
 * getContractInfo - Get basic contract information
 * @returns {object} Contract address and network info
 */
export const getContractInfo = async () => {
  if (!contract || !provider) {
    return {
      initialized: false,
      message: "Chain service not properly configured"
    };
  }

  try {
    const network = await provider.getNetwork();
    const totalSummaries = await getTotalSummaries();
    
    return {
      initialized: true,
      contractAddress: CONTRACT_ADDRESS,
      network: {
        name: network.name,
        chainId: network.chainId
      },
      totalSummaries,
      blockNumber: await provider.getBlockNumber()
    };
  } catch (err) {
    console.error("Error getting contract info:", err);
    return {
      initialized: false,
      error: err.message
    };
  }
};