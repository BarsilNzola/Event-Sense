import { generateComprehensiveAnalysis } from "./aiService.js";
import { pythService } from "../pyth/pythService.js";
import { polymarketService } from "../polymarket/polymarketService.js";
import { newsService } from "../news/newsService.js";
import { insightsStorage } from "../storage/insightsStorage.js";

class AutoInsightsService {
  constructor() {
    this.insightsHistory = []; // In-memory cache (last 2 hours)
    this.lastGenerated = null;
    this.generationInterval = 15 * 60 * 1000; // 15 minutes
    this.isGenerating = false;
    this.autoUpdateInterval = null;
    this.historyRetention = 2 * 60 * 60 * 1000; // Keep insights for 2 hours in memory
    
    this.initialize();
  }

  async initialize() {
    console.log('🚀 AutoInsightsService: Initializing...');
    setTimeout(() => {
      this.startAutoGeneration();
    }, 10000);
  }

  async generateInsights() {
    if (this.isGenerating) {
      console.log('Auto-insights: Generation already in progress');
      return this.getLatestInsight();
    }

    this.isGenerating = true;
    console.log('🤖 Auto-insights: Starting generation...');

    try {
      const [priceData, marketData, newsData] = await Promise.all([
        pythService.getAllPrices(),
        polymarketService.getMarketData(),
        newsService.getNews()
      ]);

      console.log(`📊 Auto-insights: Data sources - ${Object.keys(priceData).length} prices, ${marketData.markets?.length || 0} markets, ${newsData.articles?.length || 0} news`);

      if (Object.keys(priceData).length === 0 && (marketData.markets?.length || 0) === 0) {
        console.log('❌ Auto-insights: Insufficient data for analysis');
        throw new Error('Insufficient data from all sources');
      }

      const analysis = await generateComprehensiveAnalysis(priceData, marketData.markets || [], newsData.articles || []);

      // Create new insight object
      const newInsight = {
        id: this.generateInsightId(),
        analysis,
        timestamp: new Date().toISOString(),
        dataSources: {
          cryptoPrices: Object.keys(priceData).length,
          predictionMarkets: marketData.markets?.length || 0,
          newsArticles: newsData.articles?.length || 0
        },
        isFallback: false,
        storage: {
          ipfs: null,
          blockchain: null,
          status: 'pending'
        }
      };

      // Add to memory cache first
      this.insightsHistory.unshift(newInsight);
      this.cleanupOldInsights();
      
      // Store permanently in background (don't wait for completion)
      this.storeInsightPermanently(newInsight).catch(error => {
        console.error('❌ Background storage failed:', error.message);
      });

      this.lastGenerated = Date.now();
      console.log('✅ Auto-insights: Generated successfully. Total insights:', this.insightsHistory.length);
      
      return newInsight;

    } catch (error) {
      console.error('❌ Auto-insights: Generation failed:', error.message);
      
      // Create fallback insight
      const fallbackInsight = {
        id: this.generateInsightId(),
        analysis: "Market analysis is being updated. Comprehensive insights combining crypto prices, prediction markets, and news will be available shortly.",
        timestamp: new Date().toISOString(),
        dataSources: { cryptoPrices: 0, predictionMarkets: 0, newsArticles: 0 },
        isFallback: true,
        storage: {
          status: 'skipped'
        }
      };
      
      this.insightsHistory.unshift(fallbackInsight);
      this.cleanupOldInsights();
      
      return fallbackInsight;
    } finally {
      this.isGenerating = false;
    }
  }

  // Store insight permanently to IPFS and blockchain
  async storeInsightPermanently(insight) {
    try {
      console.log('💾 Starting permanent storage for insight:', insight.id);
      
      const storageResult = await insightsStorage.storeInsight(insight);
      
      if (storageResult.success) {
        // Update the insight with storage information
        const storedInsight = this.insightsHistory.find(i => i.id === insight.id);
        if (storedInsight) {
          storedInsight.storage = {
            ipfs: storageResult.cid,
            blockchain: storageResult.txHash,
            ipfsUrl: insightsStorage.getInsightUrl(storageResult.cid),
            blockchainUrl: storageResult.txHash ? insightsStorage.getBlockchainUrl(storageResult.txHash) : null,
            status: 'stored',
            storedAt: new Date().toISOString()
          };
        }
        
        console.log('✅ Insight permanently stored:', {
          id: insight.id,
          cid: storageResult.cid,
          txHash: storageResult.txHash
        });
      } else {
        console.error('❌ Permanent storage failed for insight:', insight.id);
        
        // Mark as failed but keep in memory
        const failedInsight = this.insightsHistory.find(i => i.id === insight.id);
        if (failedInsight) {
          failedInsight.storage.status = 'failed';
          failedInsight.storage.error = storageResult.error;
        }
      }
      
      return storageResult;
      
    } catch (error) {
      console.error('❌ Permanent storage process failed:', error.message);
      
      // Mark as failed
      const failedInsight = this.insightsHistory.find(i => i.id === insight.id);
      if (failedInsight) {
        failedInsight.storage.status = 'failed';
        failedInsight.storage.error = error.message;
      }
      
      throw error;
    }
  }

  // Get all insights from the last 2 hours
  getInsightsHistory() {
    this.cleanupOldInsights();
    return this.insightsHistory;
  }

  // Get latest insight
  getLatestInsight() {
    this.cleanupOldInsights();
    return this.insightsHistory[0] || null;
  }

  // Get stored insights (those with IPFS storage)
  getStoredInsights() {
    this.cleanupOldInsights();
    return this.insightsHistory.filter(insight => 
      insight.storage?.status === 'stored'
    );
  }

  // Clean up insights older than 2 hours
  cleanupOldInsights() {
    const cutoffTime = Date.now() - this.historyRetention;
    const initialLength = this.insightsHistory.length;
    
    this.insightsHistory = this.insightsHistory.filter(insight => 
      new Date(insight.timestamp).getTime() > cutoffTime
    );
    
    if (initialLength !== this.insightsHistory.length) {
      console.log(`🧹 Cleaned up ${initialLength - this.insightsHistory.length} old insights from memory`);
    }
  }

  generateInsightId() {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startAutoGeneration() {
    if (this.autoUpdateInterval) {
      console.log('⚠️ Auto-insights: Auto-generation already running');
      return;
    }
    
    console.log(`🚀 Auto-insights: Starting auto-generation (every ${this.generationInterval / 60000} minutes)`);
    
    // Generate immediately on startup
    this.generateInsights();
    
    // Set up recurring generation
    this.autoUpdateInterval = setInterval(() => {
      console.log('⏰ Auto-insights: Scheduled generation triggered');
      this.generateInsights();
    }, this.generationInterval);

    return this;
  }

  stopAutoGeneration() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
      console.log('🛑 Auto-insights: Auto-generation stopped');
    }
  }

  getStatus() {
    const storedCount = this.getStoredInsights().length;
    
    return {
      isRunning: !!this.autoUpdateInterval,
      lastGenerated: this.lastGenerated ? new Date(this.lastGenerated).toISOString() : null,
      isGenerating: this.isGenerating,
      insightsCount: this.insightsHistory.length,
      storedCount: storedCount,
      nextScheduled: this.lastGenerated ? new Date(this.lastGenerated + this.generationInterval).toISOString() : null,
      historyRetention: `${this.historyRetention / 3600000} hours`
    };
  }

  // Manual trigger for testing
  async triggerManualGeneration() {
    console.log('👤 Auto-insights: Manual generation triggered');
    return await this.generateInsights();
  }
}

export const autoInsightsService = new AutoInsightsService();