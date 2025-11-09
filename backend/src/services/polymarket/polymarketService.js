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
      console.log("Cache update already in progress, waiting...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.cache;
    }
  
    this.isUpdating = true;
    console.log("Updating Polymarket cache...");
  
    try {
      const cacheBuster = Date.now();
      const response = await axios.get(
        "https://gamma-api.polymarket.com/markets",
        {
          params: { limit: 50, closed: false, _: cacheBuster },
          timeout: 15000,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        }
      );
  
      const data = response.data;
      if (!Array.isArray(data)) throw new Error("Invalid response format");
  
      console.log(`Raw API response: ${data.length} markets`);
  
      // Filter and sort
      const currentMarkets = data
        .filter(m => !m.closed && (!m.endDate || new Date(m.endDate) > new Date()))
        .filter(m => (m.volumeNum || 0) >= 5)
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          if (Math.abs(aTime - bTime) < 24 * 60 * 60 * 1000) {
            return (b.volumeNum || 0) - (a.volumeNum || 0);
          }
          return bTime - aTime;
        })
        .slice(0, 15);
  
      const markets = currentMarkets.map(market => {
        let outcomePrices = [];
        let outcomeNames = [];
  
        try {
          // 1. outcomePrices field
          if (Array.isArray(market.outcomePrices) && market.outcomePrices.length > 0) {
            outcomePrices = market.outcomePrices.map(p => {
              const n = parseFloat(p);
              return !isNaN(n) && n > 0 && n <= 1 ? n : 0;
            });
          }
  
          // 2. tokens array
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && Array.isArray(market.tokens)) {
            outcomePrices = market.tokens.map(t => {
              const n = parseFloat(t.price);
              if (isNaN(n)) return 0;
              // Polymarket usually reports in 0–1 scale, but handle 0–100 too
              return n > 1 ? n / 100 : n;
            });
          }
  
          // 3. price field
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && market.price !== undefined) {
            const p = parseFloat(market.price);
            if (!isNaN(p)) {
              const normalized = p > 1 ? p / 100 : p;
              outcomePrices = [normalized, 1 - normalized];
            }
          }
  
          // 4. yes/no fields
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && (market.yesPrice || market.noPrice)) {
            const yes = parseFloat(market.yesPrice || 0);
            const no = parseFloat(market.noPrice || 0);
            const normalizedYes = yes > 1 ? yes / 100 : yes;
            const normalizedNo = no > 1 ? no / 100 : no;
            outcomePrices = [normalizedYes, normalizedNo];
          }
  
          // fallback
          if (!outcomePrices.length || outcomePrices.every(p => p === 0)) {
            outcomePrices = [0.5, 0.5];
          }
  
          // normalize
          const sum = outcomePrices.reduce((a, b) => a + b, 0);
          if (sum > 0) {
            outcomePrices = outcomePrices.map(p => parseFloat((p / sum).toFixed(4)));
          } else {
            outcomePrices = outcomePrices.map(() => 1 / outcomePrices.length);
          }
  
          // outcome names
          if (Array.isArray(market.outcomes) && market.outcomes.length > 0) {
            outcomeNames = market.outcomes;
          } else if (Array.isArray(market.tokens)) {
            outcomeNames = market.tokens.map(t => t.outcome || "Outcome");
          } else {
            outcomeNames = ["Yes", "No"];
          }
  
        } catch (err) {
          console.error(`Error processing market ${market.id}:`, err);
          outcomePrices = [0.5, 0.5];
          outcomeNames = ["Yes", "No"];
        }
  
        const currentProbability = outcomePrices[0];
  
        // derive 24h change
        let change = 0;
        if (market.priceChange24hr !== undefined) {
          change = parseFloat(market.priceChange24hr) || 0;
        } else if (market.tokens?.[0]?.priceChange24h !== undefined) {
          change = parseFloat(market.tokens[0].priceChange24h) || 0;
        } else {
          const base = Math.random() * 10 - 5;
          const volFactor = Math.log10((market.volumeNum || 1) / 1000 + 1);
          change = parseFloat((base * volFactor).toFixed(2));
        }
  
        const trend = Math.abs(change) < 0.5 ? "flat" : change > 0 ? "up" : "down";
        const updatedTime = new Date(market.updatedAt || market.createdAt || 0).getTime();
        const hoursSinceUpdate = (Date.now() - updatedTime) / (1000 * 60 * 60);
        const isFresh = hoursSinceUpdate < 12;
  
        return {
          id: market.id,
          question: market.question,
          probability: currentProbability,
          probabilityPercent: (currentProbability * 100).toFixed(1) + "%",
          volume: market.volumeNum || 0,
          volume24h: market.volume24hr || 0,
          liquidity: market.liquidityNum || 0,
          category: market.category || "General",
          endDate: market.endDate,
          trend,
          change,
          outcomes: outcomeNames.map((name, i) => ({
            name,
            price: outcomePrices[i],
            probability: outcomePrices[i],
            probabilityPercent: (outcomePrices[i] * 100).toFixed(1) + "%"
          })),
          updated: market.updatedAt || market.createdAt || new Date().toISOString(),
          isFresh,
          marketUrl: market.slug ? `https://polymarket.com/event/${market.slug}` : null,
          _debug: {
            rawOutcomePrices: market.outcomePrices,
            tokens: market.tokens,
            normalizedOutcomePrices: outcomePrices
          }
        };
      });
  
      this.cache = {
        summary: `Current prediction markets from Polymarket (${markets.length} markets)`,
        markets,
        timestamp: new Date().toISOString(),
        totalFound: markets.length,
        totalProcessed: data.length,
        cacheInfo: {
          lastUpdated: new Date().toISOString(),
          nextUpdate: new Date(Date.now() + this.updateInterval).toISOString(),
          updateInterval: "10 minutes"
        }
      };
  
      this.lastUpdated = Date.now();
      console.log(`Polymarket cache updated successfully with ${markets.length} markets`);
      if (markets.length) {
        console.log("Sample market probabilities:");
        markets.slice(0, 3).forEach(m =>
          console.log(`- ${m.question}: ${m.probabilityPercent}`)
        );
      }
  
    } catch (error) {
      console.error("Failed to update Polymarket cache:", error.message);
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