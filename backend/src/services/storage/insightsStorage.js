import { uploadToLighthouse } from "../lighthouse/lighthouseService.js";
import { storeCIDOnChain } from "../chain/chainService.js";

export class InsightsStorage {
  constructor() {
    this.uploadQueue = [];
    this.isUploading = false;
  }

  // Store a single insight to IPFS and blockchain
  async storeInsight(insight) {
    try {
      console.log('💾 Storing insight to IPFS and blockchain...');
      
      // Upload to Lighthouse IPFS
      const cid = await uploadToLighthouse(insight);
      
      if (!cid) {
        throw new Error('Failed to upload to IPFS');
      }

      console.log('✅ Insight stored on IPFS with CID:', cid);
      
      // Store CID on blockchain
      try {
        const chainResult = await storeCIDOnChain(cid);
        console.log('✅ Insight CID stored on blockchain:', chainResult.txHash);
        
        return {
          success: true,
          cid,
          txHash: chainResult.txHash,
          insightId: insight.id,
          timestamp: insight.timestamp
        };
      } catch (chainError) {
        console.error('❌ Failed to store on blockchain, but IPFS succeeded:', chainError.message);
        // Still return success since IPFS worked
        return {
          success: true,
          cid,
          txHash: null,
          insightId: insight.id,
          timestamp: insight.timestamp,
          warning: 'Blockchain storage failed'
        };
      }

    } catch (error) {
      console.error('❌ Insight storage failed:', error.message);
      return {
        success: false,
        error: error.message,
        insightId: insight.id
      };
    }
  }

  // Store multiple insights (for batch operations)
  async storeInsightsBatch(insights) {
    const results = [];
    
    for (const insight of insights) {
      const result = await this.storeInsight(insight);
      results.push(result);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // Generate a permanent URL for an insight
  getInsightUrl(cid) {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }

  // Generate a blockchain explorer URL
  getBlockchainUrl(txHash) {
    return `https://testnet.bscscan.com/tx/${txHash}`;
  }
}

export const insightsStorage = new InsightsStorage();