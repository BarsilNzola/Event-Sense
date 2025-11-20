import { generateComprehensiveAnalysis } from "./aiService.js";
import { pythService } from "../pyth/pythService.js";
import { polymarketService } from "../polymarket/polymarketService.js";
import { newsService } from "../news/newsService.js";
import { insightsStorage } from "../storage/insightsStorage.js";

class AutoInsightsService {
  constructor() {
    this.insightsHistory = [];
    this.lastGenerated = null;
    this.generationInterval = 15 * 60 * 1000; // 15 minutes
    this.isGenerating = false;
    this.autoUpdateInterval = null;
    this.historyRetention = 2 * 60 * 60 * 1000; // 2 hours
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    
    this.initialize();
  }

  async initialize() {
    console.log('AutoInsightsService: Initializing...');
    
    // Wait for dependent services to initialize
    try {
      await Promise.all([
        pythService.initialize(),
        polymarketService.initialize?.() || Promise.resolve()
      ]);
      console.log('Dependent services initialized');
    } catch (error) {
      console.warn('Some services failed to initialize:', error.message);
    }
    
    // Start auto-generation after a brief delay
    setTimeout(() => {
      this.startAutoGeneration();
    }, 15000); // 15 seconds delay
  }

  async generateInsights() {
    if (this.isGenerating) {
      console.log('Auto-insights: Generation already in progress');
      return this.getLatestInsight();
    }

    this.isGenerating = true;
    const generationStart = Date.now();
    console.log('Auto-insights: Starting generation cycle...');

    try {
      // Fetch all data sources in parallel
      const [priceData, priceChanges, marketData, newsData] = await Promise.allSettled([
        pythService.getAllPrices(),
        pythService.getAllPriceChanges('24h'),
        polymarketService.getMarketData(),
        newsService.getNews()
      ]);

      // Process results with error handling
      const prices = priceData.status === 'fulfilled' ? priceData.value : {};
      const changes = priceChanges.status === 'fulfilled' ? priceChanges.value : {};
      const markets = marketData.status === 'fulfilled' ? marketData.value?.markets || [] : [];
      const news = newsData.status === 'fulfilled' ? newsData.value?.articles || [] : [];

      console.log(`Auto-insights: Data collected -`, {
        prices: Object.keys(prices).length,
        changes: Object.keys(changes).length,
        markets: markets.length,
        news: news.length
      });

      // Check if we have sufficient data
      if (Object.keys(prices).length === 0 && markets.length === 0) {
        throw new Error('Insufficient data from price and market sources');
      }

      // Enhance price data with change information
      const enhancedPriceData = this.enhancePriceDataWithChanges(prices, changes);
      
      // Extract market insights before AI analysis
      const marketInsights = this.analyzeMarketData(markets);
      const priceTrends = this.analyzePriceTrends(enhancedPriceData);

      console.log('Pre-analysis insights:', {
        priceTrends: priceTrends.summary,
        marketOpportunities: marketInsights.topOpportunities.length
      });

      // Generate comprehensive AI analysis
      const analysis = await generateComprehensiveAnalysis(
        enhancedPriceData,
        markets,
        news,
        {
          priceTrends,
          marketInsights,
          generationTime: new Date().toISOString()
        }
      );

      // Create comprehensive insight object
      const newInsight = {
        id: this.generateInsightId(),
        analysis,
        timestamp: new Date().toISOString(),
        dataSources: {
          cryptoPrices: Object.keys(prices).length,
          priceChanges: Object.keys(changes).length,
          predictionMarkets: markets.length,
          newsArticles: news.length
        },
        metadata: {
          priceTrends,
          marketInsights,
          generationMetrics: {
            duration: Date.now() - generationStart,
            dataQuality: this.calculateDataQuality(prices, changes, markets, news)
          },
          keyFindings: this.extractKeyFindings(enhancedPriceData, markets)
        },
        isFallback: false,
        storage: {
          ipfs: null,
          blockchain: null,
          status: 'pending'
        }
      };

      // Store in memory cache
      this.insightsHistory.unshift(newInsight);
      this.cleanupOldInsights();
      
      // Reset failure counter on success
      this.consecutiveFailures = 0;

      // Store permanently in background (fire and forget)
      this.storeInsightPermanently(newInsight).catch(error => {
        console.error('Background storage failed:', error.message);
      });

      this.lastGenerated = Date.now();
      
      console.log('Auto-insights: Generation completed successfully', {
        duration: `${Date.now() - generationStart}ms`,
        totalInsights: this.insightsHistory.length,
        insightId: newInsight.id
      });
      
      return newInsight;

    } catch (error) {
      console.error('Auto-insights: Generation failed:', error.message);
      this.consecutiveFailures++;
      
      // Check if we should use fallback or fail completely
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error('Multiple consecutive failures, using fallback insight');
        return this.createFallbackInsight('System temporarily unavailable. Please check back shortly.');
      }

      // Create contextual fallback based on available data
      return this.createContextualFallback(error);
    } finally {
      this.isGenerating = false;
    }
  }

  // Enhance price data with change information
  enhancePriceDataWithChanges(prices, changes) {
    const enhanced = {};
    
    Object.keys(prices).forEach(symbol => {
      const priceInfo = prices[symbol];
      const changeInfo = changes[symbol];
      
      enhanced[symbol] = {
        ...priceInfo,
        change: changeInfo?.change || 0,
        trend: changeInfo?.trend || 'flat',
        trendStrength: this.calculateTrendStrength(changeInfo?.change || 0),
        period: '24h',
        volatility: this.calculateVolatility(priceInfo.price, changeInfo?.change || 0)
      };
    });
    
    return enhanced;
  }

  // Analyze price trends
  analyzePriceTrends(priceData) {
    const trends = {
      bullish: [],
      bearish: [],
      stable: [],
      topGainers: [],
      topLosers: [],
      summary: ''
    };

    Object.entries(priceData).forEach(([symbol, data]) => {
      const asset = { symbol, change: data.change, price: data.price, trend: data.trend };
      
      if (data.change > 3) {
        trends.bullish.push(asset);
      } else if (data.change < -3) {
        trends.bearish.push(asset);
      } else {
        trends.stable.push(asset);
      }
    });

    // Sort and get top movers
    trends.topGainers = [...trends.bullish]
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);
    
    trends.topLosers = [...trends.bearish]
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    // Generate summary
    trends.summary = this.generateTrendSummary(trends);
    
    return trends;
  }

  // Analyze prediction market data
  analyzeMarketData(markets) {
    const insights = {
      highProbability: [],
      trending: [],
      topOpportunities: [],
      volumeLeaders: [],
      summary: ''
    };

    if (!markets.length) return insights;

    // Sort by various criteria
    const byProbability = [...markets]
      .filter(m => m.probability > 0.7)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    const byVolume = [...markets]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    const byRecentChange = [...markets]
      .filter(m => Math.abs(m.change) > 2)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5);

    insights.highProbability = byProbability;
    insights.volumeLeaders = byVolume;
    insights.trending = byRecentChange;
    insights.topOpportunities = this.identifyMarketOpportunities(markets);
    insights.summary = this.generateMarketSummary(insights);

    return insights;
  }

  // Identify market opportunities based on probability and volume
  identifyMarketOpportunities(markets) {
    return markets
      .filter(market => 
        market.probability > 0.6 && 
        market.volume > 1000 && 
        Math.abs(market.change) > 1
      )
      .sort((a, b) => (b.probability * b.volume) - (a.probability * a.volume))
      .slice(0, 5);
  }

  // Calculate trend strength
  calculateTrendStrength(change) {
    const absChange = Math.abs(change);
    if (absChange > 10) return 'strong';
    if (absChange > 5) return 'moderate';
    if (absChange > 2) return 'weak';
    return 'neutral';
  }

  // Calculate volatility
  calculateVolatility(price, change) {
    return Math.min(100, Math.abs(change) * (price > 1000 ? 0.5 : 1));
  }

  // Calculate overall data quality score
  calculateDataQuality(prices, changes, markets, news) {
    let score = 0;
    let maxScore = 0;

    if (Object.keys(prices).length > 0) {
      score += Math.min(30, Object.keys(prices).length * 5);
      maxScore += 30;
    }

    if (Object.keys(changes).length > 0) {
      score += Math.min(20, Object.keys(changes).length * 4);
      maxScore += 20;
    }

    if (markets.length > 0) {
      score += Math.min(30, markets.length * 2);
      maxScore += 30;
    }

    if (news.length > 0) {
      score += Math.min(20, news.length);
      maxScore += 20;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  // Generate trend summary
  generateTrendSummary(trends) {
    const total = trends.bullish.length + trends.bearish.length + trends.stable.length;
    if (total === 0) return 'No price data available';

    const bullishPct = (trends.bullish.length / total) * 100;
    const bearishPct = (trends.bearish.length / total) * 100;

    if (bullishPct > 60) return 'Strong bullish sentiment';
    if (bearishPct > 60) return 'Strong bearish sentiment';
    if (bullishPct > bearishPct) return 'Moderately bullish';
    if (bearishPct > bullishPct) return 'Moderately bearish';
    return 'Mixed market sentiment';
  }

  // Generate market summary
  generateMarketSummary(insights) {
    if (insights.highProbability.length === 0) return 'Limited market data';

    const highProbCount = insights.highProbability.length;
    const trendingCount = insights.trending.length;

    if (highProbCount >= 3 && trendingCount >= 2) {
      return 'Active market with high-confidence opportunities';
    } else if (highProbCount >= 2) {
      return 'Several high-probability markets available';
    } else {
      return 'Limited high-probability opportunities';
    }
  }

  // Extract key findings for metadata
  extractKeyFindings(priceData, markets) {
    const findings = [];

    // Price findings
    const topGainer = Object.values(priceData)
      .filter(p => p.change > 0)
      .sort((a, b) => b.change - a.change)[0];
    
    const topLoser = Object.values(priceData)
      .filter(p => p.change < 0)
      .sort((a, b) => a.change - b.change)[0];

    if (topGainer) {
      findings.push(`${topGainer.symbol} leading gains (+${topGainer.change.toFixed(2)}%)`);
    }

    if (topLoser) {
      findings.push(`${topLoser.symbol} under pressure (${topLoser.change.toFixed(2)}%)`);
    }

    // Market findings
    const highProbMarket = markets
      .filter(m => m.probability > 0.8)
      .sort((a, b) => b.probability - a.probability)[0];

    if (highProbMarket) {
      findings.push(`High confidence: ${highProbMarket.question.substring(0, 50)}...`);
    }

    return findings.slice(0, 3); // Return top 3 findings
  }

  // Create contextual fallback based on available data
  createContextualFallback(error) {
    const fallbackMessages = [
      "Market analysis is being updated with the latest price movements and prediction market data.",
      "Processing real-time crypto prices and market opportunities. Fresh insights coming soon.",
      "Updating analysis with current market trends and prediction opportunities.",
      "Generating new insights based on latest price action and market probabilities."
    ];

    const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    return this.createFallbackInsight(randomMessage);
  }

  createFallbackInsight(message) {
    const fallbackInsight = {
      id: this.generateInsightId(),
      analysis: message,
      timestamp: new Date().toISOString(),
      dataSources: { cryptoPrices: 0, priceChanges: 0, predictionMarkets: 0, newsArticles: 0 },
      isFallback: true,
      storage: { status: 'skipped' }
    };
    
    this.insightsHistory.unshift(fallbackInsight);
    this.cleanupOldInsights();
    
    return fallbackInsight;
  }

  // Storage method (unchanged from your original)
  async storeInsightPermanently(insight) {
    try {
      console.log('Starting permanent storage for insight:', insight.id);
      
      const storageResult = await insightsStorage.storeInsight(insight);
      
      if (storageResult.success) {
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
        
        console.log('Insight permanently stored:', { id: insight.id, cid: storageResult.cid });
      }
      
      return storageResult;
    } catch (error) {
      console.error('Permanent storage failed:', error.message);
      throw error;
    }
  }

  // Existing utility methods
  getInsightsHistory() {
    this.cleanupOldInsights();
    return this.insightsHistory;
  }

  getLatestInsight() {
    this.cleanupOldInsights();
    return this.insightsHistory[0] || null;
  }

  getStoredInsights() {
    this.cleanupOldInsights();
    return this.insightsHistory.filter(insight => 
      insight.storage?.status === 'stored'
    );
  }

  cleanupOldInsights() {
    const cutoffTime = Date.now() - this.historyRetention;
    const initialLength = this.insightsHistory.length;
    
    this.insightsHistory = this.insightsHistory.filter(insight => 
      new Date(insight.timestamp).getTime() > cutoffTime
    );
    
    if (initialLength !== this.insightsHistory.length) {
      console.log(`Cleaned up ${initialLength - this.insightsHistory.length} old insights`);
    }
  }

  generateInsightId() {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startAutoGeneration() {
    if (this.autoUpdateInterval) {
      console.log('Auto-insights: Auto-generation already running');
      return;
    }
    
    console.log(`Auto-insights: Starting auto-generation (every ${this.generationInterval / 60000} minutes)`);
    
    // Generate immediately
    this.generateInsights();
    
    // Set up recurring generation
    this.autoUpdateInterval = setInterval(() => {
      console.log('Auto-insights: Scheduled generation triggered');
      this.generateInsights();
    }, this.generationInterval);
  }

  stopAutoGeneration() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
      console.log('Auto-insights: Auto-generation stopped');
    }
  }

  getStatus() {
    const storedCount = this.getStoredInsights().length;
    const latest = this.getLatestInsight();
    
    return {
      isRunning: !!this.autoUpdateInterval,
      lastGenerated: this.lastGenerated ? new Date(this.lastGenerated).toISOString() : null,
      isGenerating: this.isGenerating,
      insightsCount: this.insightsHistory.length,
      storedCount,
      consecutiveFailures: this.consecutiveFailures,
      dataQuality: latest?.metadata?.generationMetrics?.dataQuality || 0,
      nextScheduled: this.lastGenerated ? new Date(this.lastGenerated + this.generationInterval).toISOString() : null
    };
  }

  async triggerManualGeneration() {
    console.log('Auto-insights: Manual generation triggered');
    return await this.generateInsights();
  }
}

export const autoInsightsService = new AutoInsightsService();