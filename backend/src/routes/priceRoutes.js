import express from "express";
import { pythService } from "../services/pyth/pythService.js";

const router = express.Router();

// Track initialization
let initializationPromise = null;

const ensureInitialized = async () => {
  if (!initializationPromise) {
    initializationPromise = pythService.initialize();
  }
  return initializationPromise;
};

// Get all price feeds
router.get("/feeds", async (req, res) => {
  try {
    await ensureInitialized();

    const prices = pythService.getAllPrices();
    console.log('🔍 /feeds - Returning prices:', prices);
    
    res.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Price feeds error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch price feeds",
      message: error.message
    });
  }
});

// Get price feeds with changes
router.get("/feeds-with-changes", async (req, res) => {
  try {
    await ensureInitialized();

    const prices = pythService.getAllPrices();
    console.log('🔍 /feeds-with-changes - Raw prices:', prices);
    
    const pricesWithChanges = {};

    for (const [symbol, priceData] of Object.entries(prices)) {
      if (priceData && typeof priceData === 'object') {
        const changeData = pythService.getPriceChange(symbol);
        
        pricesWithChanges[symbol] = {
          price: priceData.price,
          confidence: priceData.confidence,
          change: changeData?.change || 0,
          trend: changeData?.trend || 'flat',
          timestamp: priceData.timestamp,
          isMock: priceData.isMock || false
        };
      }
    }

    console.log('🔍 /feeds-with-changes - Processed data:', pricesWithChanges);
    
    res.json({
      success: true,
      data: pricesWithChanges,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Price feeds with changes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch price feeds with changes",
      message: error.message
    });
  }
});

// Debug endpoint to see what's happening
router.get("/debug", async (req, res) => {
  try {
    await ensureInitialized();

    const allPrices = pythService.getAllPrices();
    const rawFeeds = Array.from(pythService.priceFeeds.entries());
    
    const debugInfo = {
      isConnected: pythService.isConnected,
      useMock: pythService.useMock,
      priceFeedsSize: pythService.priceFeeds.size,
      availableSymbols: Array.from(pythService.priceFeeds.keys()),
      allPrices,
      rawFeeds
    };

    console.log('🔍 Debug info:', debugInfo);
    
    res.json({
      success: true,
      ...debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Debug endpoint failed",
      message: error.message
    });
  }
});

// Test individual symbols
router.get("/test-symbols", async (req, res) => {
  try {
    await ensureInitialized();

    const testSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'USDC', 'DAI'];
    const results = {};
    
    testSymbols.forEach(symbol => {
      const price = pythService.getPrice(symbol);
      const change = pythService.getPriceChange(symbol);
      results[symbol] = { price, change };
    });

    console.log('🔍 Test symbols results:', results);
    
    res.json({ 
      success: true, 
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Test symbols error:", error);
    res.status(500).json({
      success: false,
      error: "Test symbols failed",
      message: error.message
    });
  }
});

export default router;