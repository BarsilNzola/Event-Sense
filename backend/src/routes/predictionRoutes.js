import express from "express";
import { polymarketService } from "../services/polymarket/polymarketService.js";

const router = express.Router();

// Start auto-refresh when routes are loaded
polymarketService.startAutoRefresh();

// Get cached market data
router.get("/analyze", async (req, res) => {
  try {
    const data = await polymarketService.getMarketData();
    
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(data);
    
  } catch (error) {
    console.error("Error getting Polymarket data:", error);
    res.status(500).json({ 
      error: "Could not fetch Polymarket data",
      message: error.message 
    });
  }
});

// Force cache refresh
router.get("/analyze/refresh", async (req, res) => {
  try {
    const data = await polymarketService.forceRefresh();
    res.json({
      ...data,
      note: "Cache forcefully refreshed"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache status
router.get("/cache-status", async (req, res) => {
  try {
    const status = polymarketService.getCacheStatus();
    const data = await polymarketService.getMarketData();
    
    res.json({
      status,
      dataSummary: {
        marketCount: data.markets?.length || 0,
        hasError: !!data.error
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint - get raw data without cache
router.get("/debug-raw", async (req, res) => {
  try {
    const cacheBuster = Date.now();
    const response = await axios.get(
      "https://gamma-api.polymarket.com/markets",
      {
        params: { limit: 5, closed: false, _: cacheBuster },
        timeout: 10000
      }
    );

    res.json({
      rawData: response.data.slice(0, 3),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple version
router.get("/analyze-simple", async (req, res) => {
  try {
    const markets = await polymarketService.fetchPolymarketData();
    res.json({
      summary: "Polymarket Analysis",
      markets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;