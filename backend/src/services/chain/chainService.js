import dotenv from "dotenv";
dotenv.config();

import { JsonRpcProvider, Wallet, Contract } from "ethers";

// Minimal ABI for storeSummary + event
const ABI = [
  "function storeSummary(string _cid) public",
  "event SummaryStored(address indexed author, string cid, uint256 timestamp)"
];

const RPC = process.env.BNB_TESTNET_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!RPC || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.warn("Missing RPC/PRIVATE_KEY/CONTRACT_ADDRESS in .env for chainService");
}

const provider = new JsonRpcProvider(RPC);
const wallet = new Wallet(PRIVATE_KEY, provider);
const contract = new Contract(CONTRACT_ADDRESS, ABI, wallet);

/**
 * storeCIDOnChain
 * @param {string} cid - the Lighthouse/IPFS CID to store
 * @returns {object} { txHash, receipt }
 */
export const storeCIDOnChain = async (cid) => {
  try {
    const tx = await contract.storeSummary(cid);
    console.log("Submitted tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("Tx mined:", receipt.transactionHash);
    return { txHash: receipt.transactionHash, receipt };
  } catch (err) {
    console.error("Error storing CID on chain:", err);
    throw err;
  }
};
