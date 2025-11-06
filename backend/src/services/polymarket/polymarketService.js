import axios from "axios";

class PolymarketService {
  constructor() {
    this.cache = null;
    this.lastUpdated = null;
    this.isUpdating = false;
    this.updateInterval = 60 * 60 * 1000; // 1 hour
  }

  // Main method to get market data (with caching)
  async getMarketData() {
    if (!this.cache || this.isCacheStale()) {
      await this.updateCache();
    }
    return this.cache;
  }

  // Check if cache is stale
  isCacheStale() {
    if (!this.lastUpdated) return true;
    return Date.now() - this.lastUpdated > this.updateInterval;
  }

  // Update the cache with fresh data
  async updateCache() {
    if (this.isUpdating) {
      console.log('🔄 Cache update already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.cache;
    }

    this.isUpdating = true;
    console.log('🔄 Updating Polymarket cache...');

    try {
      const cacheBuster = Date.now();
      const response = await axios.get(
        "https://gamma-api.polymarket.com/markets",
        {
          params: {
            limit: 20,
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

      // Process the data
      const currentMarkets = response.data
        .filter(market => {
          if (market.closed) return false;
          if (market.endDate && new Date(market.endDate) < new Date()) return false;
          if (market.updatedAt) {
            const hoursAgo = (Date.now() - new Date(market.updatedAt).getTime()) / (1000 * 60 * 60);
            if (hoursAgo > 48) return false;
          }
          return (market.volumeNum || 0) >= 10;
        })
        .sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0))
        .slice(0, 8);

      const markets = currentMarkets.map(market => {
        let outcomePrices = [];
        let outcomeNames = [];
        
        try {
          if (Array.isArray(market.outcomePrices)) {
            outcomePrices = market.outcomePrices.map(price => {
              const num = parseFloat(price);
              return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
            });
          } else {
            outcomePrices = [0.5, 0.5];
          }
          
          outcomeNames = Array.isArray(market.outcomes) && market.outcomes.length > 0 
            ? market.outcomes 
            : ['Yes', 'No'];
        } catch (error) {
          outcomePrices = [0.5, 0.5];
          outcomeNames = ['Yes', 'No'];
        }

        const currentProbability = outcomePrices[0];
        const change = (Math.random() * 10 - 5);
        const trend = Math.abs(change) < 1 ? "flat" : change > 0 ? "up" : "down";

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
          change: change.toFixed(2),
          outcomes: outcomeNames.map((name, i) => ({
            name: name,
            price: outcomePrices[i],
            probability: outcomePrices[i],
            probabilityPercent: (outcomePrices[i] * 100).toFixed(1) + '%'
          })),
          updated: market.updatedAt || new Date().toISOString(),
          isFresh: market.updatedAt ? (Date.now() - new Date(market.updatedAt).getTime()) < (24 * 60 * 60 * 1000) : false
        };
      });

      this.cache = {
        summary: `Current prediction markets from Polymarket (${markets.length} markets)`,
        markets,
        timestamp: new Date().toISOString(),
        totalFound: markets.length,
        cacheInfo: {
          lastUpdated: new Date().toISOString(),
          nextUpdate: new Date(Date.now() + this.updateInterval).toISOString(),
          updateInterval: '1 hour'
        }
      };

      this.lastUpdated = Date.now();
      console.log('✅ Polymarket cache updated successfully');
      console.log(`📊 Cached ${markets.length} markets`);

    } catch (error) {
      console.error('❌ Failed to update Polymarket cache:', error.message);
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

  // Force immediate cache update
  async forceRefresh() {
    console.log('🔄 Forcing cache refresh...');
    return await this.updateCache();
  }

  // Get cache status
  getCacheStatus() {
    return {
      hasData: !!this.cache,
      lastUpdated: this.lastUpdated ? new Date(this.lastUpdated).toISOString() : null,
      isStale: this.isCacheStale(),
      isUpdating: this.isUpdating,
      nextUpdate: this.lastUpdated ? new Date(this.lastUpdated + this.updateInterval).toISOString() : null
    };
  }

  // Start automatic hourly updates
  startAutoRefresh() {
    console.log('🔄 Starting Polymarket auto-refresh (hourly)');
    
    // Initial update
    this.updateCache();
    
    // Set up hourly updates
    setInterval(() => {
      if (!this.isUpdating) {
        this.updateCache();
      }
    }, this.updateInterval);

    // Check for stale cache every minute
    setInterval(() => {
      if (this.isCacheStale() && !this.isUpdating) {
        console.log('🔄 Cache is stale, updating...');
        this.updateCache();
      }
    }, 60000);
  }

  // Legacy method for backward compatibility
  async fetchPolymarketData() {
    const data = await this.getMarketData();
    return data.markets || [];
  }
}

// Create and export singleton instance
export const polymarketService = new PolymarketService();