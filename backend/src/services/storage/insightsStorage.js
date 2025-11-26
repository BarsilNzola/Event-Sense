import { uploadToLighthouse } from "../lighthouse/lighthouseService.js";
import { storeCIDOnChain, getAllSummaries } from "../chain/chainService.js";

export class InsightsStorage {
  constructor() {
    this.uploadQueue = [];
    this.isUploading = false;
  }

  // Store a single insight to IPFS and blockchain
  async storeInsight(insight) {
    try {
      console.log('Storing insight to IPFS and blockchain...');
      
      // Upload to Lighthouse IPFS
      const cid = await uploadToLighthouse(insight);
      
      if (!cid) {
        throw new Error('Failed to upload to IPFS');
      }

      console.log('Insight stored on IPFS with CID:', cid);
      
      // Store CID on blockchain
      try {
        const chainResult = await storeCIDOnChain(cid);
        console.log('Insight CID stored on blockchain:', chainResult.txHash);
        
        return {
          success: true,
          cid,
          txHash: chainResult.txHash,
          insightId: insight.id,
          timestamp: insight.timestamp
        };
      } catch (chainError) {
        console.error('Failed to store on blockchain, but IPFS succeeded:', chainError.message);
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
      console.error('Insight storage failed:', error.message);
      return {
        success: false,
        error: error.message,
        insightId: insight.id
      };
    }
  }

  // Get all stored insights from IPFS using blockchain CIDs
  async getAllStoredInsights() {
    try {
      console.log('Fetching all insights from Lighthouse storage...');
      
      // Get all CIDs from blockchain
      const summaries = await getAllSummaries();
      console.log(`Found ${summaries.length} insights on blockchain`);
      
      const insights = [];
      
      for (const summary of summaries) {
        try {
          // Fetch insight data from IPFS using the CID
          const insight = await this.getInsightFromIPFS(summary.cid);
          if (insight) {
            insights.push({
              ...insight,
              storage: {
                ipfs: summary.cid,
                blockchain: summary.txHash,
                ipfsUrl: this.getInsightUrl(summary.cid),
                blockchainUrl: summary.txHash ? this.getBlockchainUrl(summary.txHash) : null,
                status: 'stored',
                storedAt: summary.timestamp
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch insight ${summary.cid}:`, error.message);
        }
      }
      
      // Sort by timestamp (newest first)
      const sortedInsights = insights.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      console.log(`Successfully loaded ${sortedInsights.length} insights from IPFS`);
      return sortedInsights;
      
    } catch (error) {
      console.error('Failed to get all insights:', error.message);
      return [];
    }
  }

  // Fetch a single insight from IPFS by CID
  async getInsightFromIPFS(cid) {
    try {
      const response = await fetch(this.getInsightUrl(cid));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch insight ${cid} from IPFS:`, error.message);
      return null;
    }
  }

  // Get insights from the last 24 hours
  async getRecentInsights(hours = 24) {
    try {
      const allInsights = await this.getAllStoredInsights();
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const recentInsights = allInsights.filter(insight => 
        new Date(insight.timestamp) >= cutoffTime
      );
      
      console.log(`Found ${recentInsights.length} insights from last ${hours} hours`);
      return recentInsights;
      
    } catch (error) {
      console.error('Failed to get recent insights:', error.message);
      return [];
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