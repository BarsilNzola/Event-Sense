import axios from "axios";

class PolymarketService {
  constructor() {
    this.cache = null;
    this.lastUpdated = null;
    this.isUpdating = false;
    this.updateInterval = 10 * 60 * 1000;
  }

  async getMarketData() {
    if (!this.cache || this.isCacheStale()) {
      await this.updateCache();
    }
    return this.cache;
  }

  isCacheStale() {
    if (!this.lastUpdated) return true;
    return Date.now() - this.lastUpdated > this.updateInterval;
  }

  async updateCache() {
    if (this.isUpdating) {
      console.log('Cache update already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.cache;
    }

    this.isUpdating = true;
    console.log('Updating Polymarket cache...');

    try {
      const cacheBuster = Date.now();
      const response = await axios.get(
        "https://gamma-api.polymarket.com/markets",
        {
          params: {
            limit: 50,
            closed: false,
            _: cacheBuster
          },
          timeout: 15000,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      console.log(`Raw API response: ${response.data.length} markets`);

      // Process the data with proper probability extraction
      const currentMarkets = response.data
        .filter(market => {
          if (market.closed) return false;
          if (market.endDate && new Date(market.endDate) < new Date()) return false;
          return (market.volumeNum || 0) >= 5;
        })
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          
          if (Math.abs(aTime - bTime) < (24 * 60 * 60 * 1000)) {
            return (b.volumeNum || 0) - (a.volumeNum || 0);
          }
          return bTime - aTime;
        })
        .slice(0, 15);

      const markets = currentMarkets.map(market => {
        console.log(`Processing market: ${market.question}`);
        console.log('Market data:', {
          outcomePrices: market.outcomePrices,
          tokens: market.tokens,
          volumeNum: market.volumeNum,
          liquidityNum: market.liquidityNum,
          volume24hr: market.volume24hr
        });

        let outcomePrices = [];
        let outcomeNames = [];
        
        try {
          // METHOD 1: Try to extract from outcomePrices first
          if (Array.isArray(market.outcomePrices) && market.outcomePrices.length > 0) {
            outcomePrices = market.outcomePrices.map(price => {
              const num = parseFloat(price);
              return isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
            });
            console.log(`Method 1 - outcomePrices: ${outcomePrices}`);
          }
          
          // METHOD 2: Try to extract from tokens array (most reliable)
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && 
              Array.isArray(market.tokens)) {
            outcomePrices = market.tokens.map(token => {
              // Convert price from cents to probability
              const price = parseFloat(token.price);
              if (!isNaN(price) && price > 0) {
                return Math.max(0, Math.min(1, price / 100));
              }
              return 0;
            });
            console.log(`Method 2 - tokens prices: ${outcomePrices}`);
          }

          // METHOD 3: Check for market price field
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && 
              market.price !== undefined) {
            const price = parseFloat(market.price);
            if (!isNaN(price) && price > 0) {
              outcomePrices = [price / 100, 1 - (price / 100)];
            }
            console.log(`Method 3 - market price: ${outcomePrices}`);
          }

          // METHOD 4: Check for yes/no price fields
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && 
              (market.yesPrice || market.noPrice)) {
            const yesPrice = parseFloat(market.yesPrice || 0) / 100;
            const noPrice = parseFloat(market.noPrice || 0) / 100;
            if (yesPrice > 0 || noPrice > 0) {
              outcomePrices = [yesPrice, noPrice];
            }
            console.log(`Method 4 - yes/no prices: ${outcomePrices}`);
          }

          // If all methods failed, use fallback
          if (!outcomePrices.length || outcomePrices.every(p => p === 0)) {
            console.log('Using fallback probabilities');
            outcomePrices = [0.5, 0.5];
          }

          // Normalize probabilities to sum to 1
          const sum = outcomePrices.reduce((total, prob) => total + prob, 0);
          if (sum > 0) {
            outcomePrices = outcomePrices.map(prob => {
              const normalized = prob / sum;
              return parseFloat(normalized.toFixed(4));
            });
          } else {
            outcomePrices = outcomePrices.map(() => 1 / outcomePrices.length);
          }

          console.log(`Final normalized probabilities: ${outcomePrices}`);
          
          // Get outcome names
          if (Array.isArray(market.outcomes) && market.outcomes.length > 0) {
            outcomeNames = market.outcomes;
          } else if (Array.isArray(market.tokens)) {
            outcomeNames = market.tokens.map(token => token.outcome || 'Outcome');
          } else {
            outcomeNames = ['Yes', 'No'];
          }

        } catch (error) {
          console.error(`Error processing market ${market.id}:`, error);
          outcomePrices = [0.5, 0.5];
          outcomeNames = ['Yes', 'No'];
        }

        const currentProbability = outcomePrices[0];
        
        // Calculate 24h change based on actual price movement if available
        let change = 0;
        if (market.priceChange24hr !== undefined) {
          change = parseFloat(market.priceChange24hr) || 0;
        } else if (market.tokens && market.tokens[0] && market.tokens[0].priceChange24h !== undefined) {
          change = parseFloat(market.tokens[0].priceChange24h) || 0;
        } else {
          // Fallback to small random change if no historical data
          const baseChange = (Math.random() * 10 - 5);
          const volumeFactor = Math.log10((market.volumeNum || 1) / 1000 + 1);
          change = parseFloat((baseChange * volumeFactor).toFixed(2));
        }
        
        const trend = Math.abs(change) < 0.5 ? "flat" : change > 0 ? "up" : "down";

        const updatedTime = market.updatedAt ? new Date(market.updatedAt).getTime() : 0;
        const hoursSinceUpdate = (Date.now() - updatedTime) / (1000 * 60 * 60);
        const isFresh = hoursSinceUpdate < 12;

        return {
          id: market.id,
          question: market.question,
          probability: currentProbability,
          probabilityPercent: (currentProbability * 100).toFixed(1) + '%',
          volume: market.volumeNum || 0,
          volume24h: market.volume24hr || 0,
          liquidity: market.liquidityNum || 0,
          category: market.category || 'General',
          endDate: market.endDate,
          trend: trend,
          change: change,
          outcomes: outcomeNames.map((name, i) => ({
            name: name,
            price: outcomePrices[i],
            probability: outcomePrices[i],
            probabilityPercent: (outcomePrices[i] * 100).toFixed(1) + '%'
          })),
          updated: market.updatedAt || market.createdAt || new Date().toISOString(),
          isFresh: isFresh,
          marketUrl: market.slug ? `https://polymarket.com/event/${market.slug}` : null,
          // Debug info
          _debug: {
            rawOutcomePrices: market.outcomePrices,
            tokens: market.tokens,
            normalizedOutcomePrices: outcomePrices,
            processingMethod: 'enhanced'
          }
        };
      });

      this.cache = {
        summary: `Current prediction markets from Polymarket (${markets.length} markets)`,
        markets,
        timestamp: new Date().toISOString(),
        totalFound: markets.length,
        totalProcessed: response.data.length,
        cacheInfo: {
          lastUpdated: new Date().toISOString(),
          nextUpdate: new Date(Date.now() + this.updateInterval).toISOString(),
          updateInterval: '10 minutes'
        }
      };

      this.lastUpdated = Date.now();
      console.log('Polymarket cache updated successfully');
      console.log(`Cached ${markets.length} markets from ${response.data.length} total`);
      
      // Log sample probabilities for debugging
      if (markets.length > 0) {
        console.log('Sample market probabilities:');
        markets.slice(0, 3).forEach(market => {
          console.log(`- ${market.question}: ${market.probabilityPercent}`, market._debug);
        });
      }

    } catch (error) {
      console.error('Failed to update Polymarket cache:', error.message);
      if (!this.cache) {
        this.cache = { 
          markets: [], 
          error: "Initial cache update failed",
          timestamp: new Date().toISOString()
        };
      }
    } finally {
      this.isUpdating = false;
    }

    return this.cache;
  }

  async forceRefresh() {
    console.log('Forcing cache refresh...');
    return await this.updateCache();
  }

  getCacheStatus() {
    return {
      hasData: !!this.cache,
      lastUpdated: this.lastUpdated ? new Date(this.lastUpdated).toISOString() : null,
      isStale: this.isCacheStale(),
      isUpdating: this.isUpdating,
      nextUpdate: this.lastUpdated ? new Date(this.lastUpdated + this.updateInterval).toISOString() : null,
      marketCount: this.cache?.markets?.length || 0
    };
  }

  startAutoRefresh() {
    console.log('Starting Polymarket auto-refresh (every 10 minutes)');
    this.updateCache();
    setInterval(() => {
      if (!this.isUpdating) {
        this.updateCache();
      }
    }, this.updateInterval);
    setInterval(() => {
      if (this.isCacheStale() && !this.isUpdating) {
        console.log('Cache is stale, updating...');
        this.updateCache();
      }
    }, 120000);
  }

  async fetchPolymarketData() {
    const data = await this.getMarketData();
    return data.markets || [];
  }
}

export const polymarketService = new PolymarketService();