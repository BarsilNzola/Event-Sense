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
      const response = await axios.get("https://gamma-api.polymarket.com/markets", {
        params: { limit: 50, closed: false, _: cacheBuster },
        timeout: 15000,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });
  
      const data = response.data;
      if (!Array.isArray(data)) throw new Error("Invalid response format");
  
      console.log(`Raw API response: ${data.length} markets`);
  
      // NB: you can change sort / filter to pick latest/popular markets:
      // e.g. add params: order: "volumeNum.desc" or use server-side ordering via the API
      const currentMarkets = data
        .filter(m => !m.closed && (!m.endDate || new Date(m.endDate) > new Date()))
        // Removed strict volume filter so you can see fresh markets; re-enable if needed
        //.filter(m => (m.volumeNum || 0) >= 5)
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          if (Math.abs(aTime - bTime) < 24 * 60 * 60 * 1000) {
            return (b.volumeNum || 0) - (a.volumeNum || 0);
          }
          return bTime - aTime;
        })
        .slice(0, 15);
  
      const markets = await Promise.all(currentMarkets.map(async market => {
        let outcomePrices = [];
        let outcomeNames = [];
  
        try {
          // 1) outcomes/or outcomePrices might be JSON strings, parse if needed
          if (typeof market.outcomes === "string") {
            try {
              const parsed = JSON.parse(market.outcomes);
              if (Array.isArray(parsed)) outcomeNames = parsed;
            } catch (e) {
              // leave outcomeNames for later
            }
          } else if (Array.isArray(market.outcomes)) {
            outcomeNames = market.outcomes.map(o => (typeof o === "string" ? o : (o.name || "Outcome")));
          }
  
          if (typeof market.outcomePrices === "string") {
            try {
              const parsedPrices = JSON.parse(market.outcomePrices);
              if (Array.isArray(parsedPrices)) {
                outcomePrices = parsedPrices.map(p => {
                  const n = parseFloat(p);
                  return isNaN(n) ? 0 : (n > 1 ? n / 100 : n);
                });
              }
            } catch (e) {
              // ignore parse error
            }
          } else if (Array.isArray(market.outcomePrices)) {
            outcomePrices = market.outcomePrices.map(p => {
              const n = parseFloat(p);
              return isNaN(n) ? 0 : (n > 1 ? n / 100 : n);
            });
          }
  
          // 2) If market.outcomes is an array of objects with price fields (newer schema)
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && Array.isArray(market.outcomes)) {
            // outcomes might be objects: [{ name: "Yes", price: "0.12" }, ...]
            const maybePrices = market.outcomes.map(o => {
              if (o == null) return 0;
              const priceField = o.price ?? o.lastPrice ?? o.bestBid ?? o.bestAsk ?? o.midPrice;
              const n = parseFloat(priceField);
              return isNaN(n) ? 0 : (n > 1 ? n / 100 : n);
            }).filter(p => !isNaN(p));
            if (maybePrices.length) {
              outcomePrices = maybePrices;
              outcomeNames = market.outcomes.map(o => (o?.name ?? "Outcome"));
            }
          }
  
          // 3) tokens array (if present) — tokens often include price fields
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && Array.isArray(market.tokens)) {
            outcomeNames = outcomeNames.length ? outcomeNames : market.tokens.map(t => t.outcome || "Outcome");
            const tokenPrices = market.tokens.map(t => {
              const n = parseFloat(t.last_price ?? t.price ?? t.lastPrice ?? t.midPrice ?? 0);
              return isNaN(n) ? 0 : (n > 1 ? n / 100 : n);
            }).filter(p => !isNaN(p));
            if (tokenPrices.length) outcomePrices = tokenPrices;
          }
  
          // 4) lastTradePrice / bestBid / bestAsk — use if we still don't have outcomePrices
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0))) {
            // lastTradePrice might represent the price for the 'Yes' outcome in some markets
            if (market.lastTradePrice && parseFloat(market.lastTradePrice) > 0) {
              const p = parseFloat(market.lastTradePrice);
              outcomePrices = [p > 1 ? p / 100 : p, 1 - (p > 1 ? p / 100 : p)];
              outcomeNames = outcomeNames.length ? outcomeNames : ["Yes", "No"];
            } else if (market.bestBid || market.bestAsk) {
              // convert bestBid/bestAsk into a mid price
              const bid = parseFloat(market.bestBid) || 0;
              const ask = parseFloat(market.bestAsk) || 0;
              if (bid > 0 || ask > 0) {
                // If bestBid is for Yes side and bestAsk for Yes or vice versa depends on schema,
                // use mid-point as best-effort estimate (and convert scale)
                const mid = (bid && ask) ? ((bid + ask) / 2) : (bid || ask);
                const midNorm = mid > 1 ? mid / 100 : mid;
                outcomePrices = [midNorm, 1 - midNorm];
                outcomeNames = outcomeNames.length ? outcomeNames : ["Yes", "No"];
              }
            }
          }
  
          // 5) Optional: call pricing CLOB endpoint if clobTokenIds exist (uncomment to enable)
          if ((!outcomePrices.length || outcomePrices.every(p => p === 0)) && market.clobTokenIds) {
            try {
              // POST to clob price endpoint to get best bid/ask by token id
              const tokenIds = Array.isArray(market.clobTokenIds) ? market.clobTokenIds : [market.clobTokenIds];
              const clobResp = await axios.post("https://clob.polymarket.com/price", { token_id: tokenIds[0], side: "BUY" });
              const clobPrice = parseFloat(clobResp.data?.price);
              if (!isNaN(clobPrice)) {
                const p = clobPrice > 1 ? clobPrice / 100 : clobPrice;
                outcomePrices = [p, 1 - p];
              }
            } catch (e) {
              // ignore
            }
          }
  
          // 6) If still no prices, fallback to 50/50 but log for debugging
          if (!outcomePrices.length || outcomePrices.every(p => p === 0 || isNaN(p))) {
            console.warn(`No usable price found for market id=${market.id}, title="${market.question || market.title || market.slug}". Falling back to 50/50.`);
            outcomePrices = [0.5, 0.5];
            outcomeNames = outcomeNames.length ? outcomeNames : (Array.isArray(market.outcomes) ? market.outcomes.map(o => (typeof o === 'string' ? o : (o.name || 'Outcome'))) : ['Yes','No']);
          }
  
          // Normalize so sum = 1
          const sum = outcomePrices.reduce((a, b) => a + b, 0);
          if (sum > 0) {
            outcomePrices = outcomePrices.map(p => parseFloat((p / sum).toFixed(4)));
          } else {
            const fallback = 1 / outcomePrices.length;
            outcomePrices = outcomePrices.map(() => parseFloat(fallback.toFixed(4)));
          }
  
        } catch (err) {
          console.error(`Error processing market ${market.id}:`, err);
          outcomePrices = [0.5, 0.5];
          outcomeNames = outcomeNames.length ? outcomeNames : ['Yes', 'No'];
        }
  
        const currentProbability = outcomePrices[0] || 0.5;
  
        // derive 24h change if available
        let change = 0;
        if (market.oneDayPriceChange !== undefined) {
          change = parseFloat(market.oneDayPriceChange) || 0;
        } else if (market.priceChange24hr !== undefined) {
          change = parseFloat(market.priceChange24hr) || 0;
        }
  
        const trend = Math.abs(change) < 0.5 ? "flat" : change > 0 ? "up" : "down";
        const updatedTime = new Date(market.updatedAt || market.createdAt || 0).getTime();
        const hoursSinceUpdate = isFinite(updatedTime) && updatedTime > 0 ? (Date.now() - updatedTime) / (1000 * 60 * 60) : Infinity;
        const isFresh = hoursSinceUpdate < 12;
  
        return {
          id: market.id,
          question: market.question || market.title || market.slug || "Untitled Market",
          probability: currentProbability,
          probabilityPercent: (currentProbability * 100).toFixed(1) + "%",
          volume: market.volumeNum || market.volume24hr || market.volume || 0,
          volume24h: market.volume24hr || 0,
          liquidity: market.liquidityNum || market.liquidity || 0,
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
            rawOutcomes: market.outcomes,
            rawOutcomePrices: market.outcomePrices,
            lastTradePrice: market.lastTradePrice,
            bestBid: market.bestBid,
            bestAsk: market.bestAsk,
            clobTokenIds: market.clobTokenIds || null,
            normalizedPrices: outcomePrices
          }
        };
      }));
  
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
      markets.slice(0, 3).forEach(m => console.log(`- ${m.question}: ${m.probabilityPercent}`, m._debug));
  
    } catch (error) {
      console.error("Failed to update Polymarket cache:", error?.response?.data || error?.message || error);
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