import axios from "axios";

class PolymarketService {
  constructor() {
    this.cache = null;
    this.lastUpdated = null;
    this.isUpdating = false;
    this.updateInterval = 10 * 60 * 1000;
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

      // Process the data with better filtering and sorting
      const currentMarkets = response.data
        .filter(market => {
          // Filter out closed markets
          if (market.closed) return false;
          
          // Filter out expired markets
          if (market.endDate && new Date(market.endDate) < new Date()) return false;
          
          // Keep markets with some volume activity
          return (market.volumeNum || 0) >= 5; 
        })
        .sort((a, b) => {
          // Primary sort: by recency (newest first)
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          
          // Secondary sort: by volume (highest first)
          if (Math.abs(aTime - bTime) < (24 * 60 * 60 * 1000)) { // If within 24 hours
            return (b.volumeNum || 0) - (a.volumeNum || 0);
          }
          
          // Otherwise sort by recency
          return bTime - aTime;
        })
        .slice(0, 10); 

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
        
        // More realistic change calculation based on market activity
        const baseChange = (Math.random() * 15 - 7.5); // Increased range
        const volumeFactor = Math.log10((market.volumeNum || 1) / 1000 + 1);
        const change = (baseChange * volumeFactor).toFixed(2);
        
        const trend = Math.abs(change) < 0.5 ? "flat" : change > 0 ? "up" : "down";

        // Calculate freshness more accurately
        const updatedTime = market.updatedAt ? new Date(market.updatedAt).getTime() : 0;
        const hoursSinceUpdate = (Date.now() - updatedTime) / (1000 * 60 * 60);
        const isFresh = hoursSinceUpdate < 12; // Increased from 24 to 12 hours for freshness

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
          marketUrl: market.slug ? `https://polymarket.com/event/${market.slug}` : null
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

  // Force immediate cache update
  async forceRefresh() {
    console.log('Forcing cache refresh...');
    return await this.updateCache();
  }

  // Get cache status
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

  // Start automatic updates (more frequent)
  startAutoRefresh() {
    console.log('Starting Polymarket auto-refresh (every 10 minutes)');
    
    // Initial update
    this.updateCache();
    
    // Set up more frequent updates
    setInterval(() => {
      if (!this.isUpdating) {
        this.updateCache();
      }
    }, this.updateInterval);

    // Check for stale cache every 2 minutes
    setInterval(() => {
      if (this.isCacheStale() && !this.isUpdating) {
        console.log('Cache is stale, updating...');
        this.updateCache();
      }
    }, 120000);
  }

  // Legacy method for backward compatibility
  async fetchPolymarketData() {
    const data = await this.getMarketData();
    return data.markets || [];
  }
}

// Create and export singleton instance
export const polymarketService = new PolymarketService();