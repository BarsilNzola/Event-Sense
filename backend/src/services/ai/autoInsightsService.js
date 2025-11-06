import { generateComprehensiveAnalysis } from "./aiService.js";
import { pythService } from "../pyth/pythService.js";
import { polymarketService } from "../polymarket/polymarketService.js";
import { newsService } from "../news/newsService.js";

class AutoInsightsService {
  constructor() {
    this.insightsCache = null;
    this.lastGenerated = null;
    this.generationInterval = 15 * 60 * 1000; // 15 minutes
    this.isGenerating = false;
    this.autoUpdateInterval = null;
  }

  async generateInsights() {
    if (this.isGenerating) {
      console.log('Auto-insights: Generation already in progress, returning cached data');
      return this.insightsCache;
    }

    this.isGenerating = true;
    console.log('🤖 Auto-insights: Starting generation...');

    try {
      // Get fresh data from all services
      const [priceData, marketData, newsData] = await Promise.all([
        pythService.getAllPrices(),
        polymarketService.getMarketData(),
        newsService.getNews()
      ]);

      console.log(`📊 Auto-insights: Data sources - ${Object.keys(priceData).length} prices, ${marketData.markets?.length || 0} markets, ${newsData.articles?.length || 0} news`);

      // Check if we have enough data
      if (Object.keys(priceData).length === 0 && (marketData.markets?.length || 0) === 0 && (newsData.articles?.length || 0) === 0) {
        console.log('❌ Auto-insights: Insufficient data for analysis');
        throw new Error('Insufficient data from all sources');
      }

      const analysis = await generateComprehensiveAnalysis(priceData, marketData, newsData);

      this.insightsCache = {
        analysis,
        timestamp: new Date().toISOString(),
        dataSources: {
          cryptoPrices: Object.keys(priceData).length,
          predictionMarkets: marketData.markets?.length || 0,
          newsArticles: newsData.articles?.length || 0
        },
        nextUpdate: new Date(Date.now() + this.generationInterval).toISOString()
      };

      this.lastGenerated = Date.now();
      console.log('✅ Auto-insights: Generated successfully');

      return this.insightsCache;

    } catch (error) {
      console.error('❌ Auto-insights: Generation failed:', error.message);
      
      // Create fallback insights if no cache exists
      if (!this.insightsCache) {
        this.insightsCache = {
          analysis: "Market analysis is being updated. Comprehensive insights combining crypto prices, prediction markets, and news will be available shortly.",
          timestamp: new Date().toISOString(),
          dataSources: { cryptoPrices: 0, predictionMarkets: 0, newsArticles: 0 },
          isFallback: true
        };
      }
      
      return this.insightsCache;
    } finally {
      this.isGenerating = false;
    }
  }

  async getLatestInsights() {
    // If no cache or cache is stale, generate new insights
    if (!this.insightsCache || !this.lastGenerated || 
        (Date.now() - this.lastGenerated) > this.generationInterval) {
      console.log('🔄 Auto-insights: Cache is stale or empty, generating new insights');
      return await this.generateInsights();
    }
    
    console.log('📁 Auto-insights: Returning cached insights');
    return this.insightsCache;
  }

  startAutoGeneration() {
    console.log('🚀 Auto-insights: Starting auto-generation (every 15 minutes)');
    
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
    return {
      isRunning: !!this.autoUpdateInterval,
      lastGenerated: this.lastGenerated ? new Date(this.lastGenerated).toISOString() : null,
      isGenerating: this.isGenerating,
      hasCache: !!this.insightsCache,
      nextScheduled: this.lastGenerated ? new Date(this.lastGenerated + this.generationInterval).toISOString() : null
    };
  }
}

export const autoInsightsService = new AutoInsightsService();