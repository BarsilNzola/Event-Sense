import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/analyze", async (req, res) => {
  try {
    const response = await axios.get(
      "https://gamma-api.polymarket.com/markets",
      {
        params: {
          limit: 10,
          closed: false,
        },
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      }
    );

    console.log("🔍 Polymarket API response status:", response.status);
    
    let marketsArr = response.data;
    
    if (!Array.isArray(marketsArr)) {
      console.error("❌ Expected array but got:", typeof marketsArr);
      return res.status(500).json({ error: "Unexpected API response format" });
    }

    // Filter and sort manually
    const currentMarkets = marketsArr
      .filter(market => {
        if (market.closed) return false;
        if (market.endDate && new Date(market.endDate) < new Date()) return false;
        return true;
      })
      .sort((a, b) => {
        const volumeA = a.volumeNum || a.volume || 0;
        const volumeB = b.volumeNum || b.volume || 0;
        return volumeB - volumeA;
      })
      .slice(0, 5);

    if (currentMarkets.length === 0) {
      console.error("❌ No current markets found after filtering");
      return res.status(404).json({ error: "No active markets found" });
    }

    console.log(`🔍 Found ${currentMarkets.length} current markets`);

    const markets = currentMarkets.map((market, index) => {
      console.log(`🔍 Market ${index} outcomePrices type:`, typeof market.outcomePrices);
      console.log(`🔍 Market ${index} outcomePrices value:`, market.outcomePrices);
      
      // Safe outcome prices parsing
      let outcomePrices = [];
      if (Array.isArray(market.outcomePrices)) {
        outcomePrices = market.outcomePrices.map(price => parseFloat(price) || 0);
      } else if (market.outcomePrices && typeof market.outcomePrices === 'object') {
        // If it's an object, convert values to array
        outcomePrices = Object.values(market.outcomePrices).map(price => parseFloat(price) || 0);
      } else if (typeof market.outcomePrices === 'string') {
        // If it's a string, try to parse it
        try {
          const parsed = JSON.parse(market.outcomePrices);
          outcomePrices = Array.isArray(parsed) ? parsed.map(p => parseFloat(p) || 0) : [];
        } catch {
          outcomePrices = [];
        }
      }
      
      const outcomeNames = Array.isArray(market.outcomes) ? market.outcomes : [];
      
      // Get the probability of the first outcome
      const currentProbability = outcomePrices[0] || 0.5;
      
      // Calculate 24h price change if available
      const priceChange24h = market.oneDayPriceChange || 0;

      // Build proper outcomes array
      const outcomes = outcomeNames.map((name, i) => ({
        name: name,
        price: outcomePrices[i] || 0,
        probability: outcomePrices[i] || 0
      }));

      return {
        id: market.id,
        question: market.question,
        probability: currentProbability,
        volume: market.volumeNum || market.volume || 0,
        volume24h: market.volume24hr || 0,
        liquidity: market.liquidityNum || market.liquidity || 0,
        category: market.category,
        endDate: market.endDate,
        closed: market.closed,
        active: market.active,
        trend: priceChange24h > 0 ? "up" : priceChange24h < 0 ? "down" : "flat",
        change: (priceChange24h * 100).toFixed(2),
        outcomes: outcomes,
        updated: market.updatedAt || new Date().toISOString(),
        history: [
          { 
            date: "Today", 
            probability: currentProbability,
            timestamp: new Date().toISOString()
          },
          {
            date: "24h ago",
            probability: Math.max(0, Math.min(1, currentProbability - priceChange24h)),
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
        ],
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({ 
      summary: "Current prediction markets from Polymarket", 
      markets,
      timestamp: new Date().toISOString(),
      totalFound: currentMarkets.length
    });
    
  } catch (error) {
    console.error("❌ Error fetching Polymarket data:", error.message);
    
    if (error.response) {
      console.error("❌ API Response status:", error.response.status);
      console.error("❌ API Response data:", error.response.data);
    }
    
    res.status(500).json({ 
      error: "Could not fetch Polymarket data",
      message: error.message 
    });
  }
});

// Simple robust version
router.get("/analyze-simple", async (req, res) => {
  try {
    const response = await axios.get(
      "https://gamma-api.polymarket.com/markets",
      {
        params: {
          limit: 10,
          closed: false,
        },
        timeout: 10000
      }
    );

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format");
    }

    const currentMarkets = response.data
      .filter(market => {
        if (market.closed) return false;
        if (market.endDate && new Date(market.endDate) < new Date()) return false;
        return true;
      })
      .sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0))
      .slice(0, 5);

    const markets = currentMarkets.map(market => {
      // Very safe outcome prices handling
      let outcomePrices = [];
      try {
        if (Array.isArray(market.outcomePrices)) {
          outcomePrices = market.outcomePrices.map(p => {
            const num = parseFloat(p);
            return isNaN(num) ? 0 : num;
          });
        }
      } catch (error) {
        console.log("❌ Error parsing outcomePrices:", error.message);
        outcomePrices = [0.5, 0.5]; // Default fallback
      }

      const outcomeNames = Array.isArray(market.outcomes) ? market.outcomes : ['Yes', 'No'];
      const currentProbability = outcomePrices[0] || 0.5;

      return {
        id: market.id,
        question: market.question,
        probability: currentProbability,
        probabilityPercent: (currentProbability * 100).toFixed(1) + '%',
        volume: market.volumeNum || 0,
        volume24h: market.volume24hr || 0,
        liquidity: market.liquidityNum || 0,
        category: market.category,
        endDate: market.endDate,
        outcomes: outcomeNames.slice(0, 2).map((name, i) => ({
          name: name,
          probability: outcomePrices[i] || 0.5,
          probabilityPercent: ((outcomePrices[i] || 0.5) * 100).toFixed(1) + '%'
        })),
        updated: new Date().toISOString()
      };
    });

    res.json({
      summary: "Polymarket Analysis",
      markets,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to see raw market data
router.get("/debug-market", async (req, res) => {
  try {
    const response = await axios.get(
      "https://gamma-api.polymarket.com/markets",
      {
        params: {
          limit: 3,
          closed: false,
        }
      }
    );

    const debugData = response.data.slice(0, 3).map(market => ({
      id: market.id,
      question: market.question,
      outcomePrices: market.outcomePrices,
      outcomePricesType: typeof market.outcomePrices,
      outcomes: market.outcomes,
      volumeNum: market.volumeNum,
      rawOutcomePrices: market.outcomePrices
    }));

    res.json({
      debug: debugData,
      note: "Check the outcomePrices structure to understand the data format"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;