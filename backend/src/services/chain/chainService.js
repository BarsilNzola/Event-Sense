import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import EventSenseStorageArtifact from "../../../smart-contracts/artifacts/contracts/EventSenseStorage.sol/EventSenseStorage.json" assert { type: "json" };

// Resolve the root directory (where .env is)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../.env");

// Load .env from root directory
dotenv.config({ path: envPath });

const RPC = process.env.BNB_TESTNET_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!RPC || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.warn("⚠️ Missing RPC/PRIVATE_KEY/CONTRACT_ADDRESS in .env for chainService");
}

const provider = new JsonRpcProvider(RPC);
const wallet = new Wallet(PRIVATE_KEY, provider);
const contract = new Contract(CONTRACT_ADDRESS, EventSenseStorageArtifact.abi, wallet);

/**
 * storeCIDOnChain
 * @param {string} cid - the Lighthouse/IPFS CID to store
 * @returns {object} { txHash, receipt }
 */
export const storeCIDOnChain = async (cid) => {
  try {
    const tx = await contract.storeSummary(cid);
    console.log("📤 Submitted tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Tx mined:", receipt.transactionHash);
    return { txHash: receipt.transactionHash, receipt };
  } catch (err) {
    console.error("❌ Error storing CID on chain:", err);
    throw err;
  }
};
