import express from "express";
import { generateAIResponse, generateAISummary, generateComprehensiveAnalysis, testGeminiConnection } from '../services/ai/aiService.js';
import { autoInsightsService } from "../services/ai/autoInsightsService.js";
import { 
  storeCIDOnChain, 
  getTotalSummaries, 
  getAllSummaries, 
  verifyCIDOnChain,
  getContractInfo 
} from '../services/chain/chainService.js';

const router = express.Router();

// ==================== GEMINI DEBUG ROUTES ====================

router.get('/debug-gemini', async (req, res) => {
  console.log('GEMINI DEBUG START');
  
  // Check environment variables
  console.log('1. Checking environment...');
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY.length);
    console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  }
  
  // Test direct Gemini connection
  console.log('2. Testing direct Gemini connection...');
  try {
    const testResult = await testGeminiConnection();
    console.log('Direct test result:', testResult);
  } catch (error) {
    console.log('Direct test error:', error.message);
  }
  
  console.log('GEMINI DEBUG END');
  
  res.json({ 
    status: 'debug_complete',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
  });
});

// ==================== AI INSIGHTS ROUTES ====================

// Get insights history (last 2 hours)
router.get("/insights/history", async (req, res) => {
  try {
    // First try to get from memory cache (fast)
    const memoryInsights = autoInsightsService.getInsightsHistory();
    
    // Filter memory insights to only last 2 hours
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
    const recentMemoryInsights = memoryInsights.filter(insight => 
      new Date(insight.timestamp) >= twoHoursAgo
    );
    
    if (recentMemoryInsights.length > 0) {
      return res.json({
        success: true,
        insights: recentMemoryInsights,
        count: recentMemoryInsights.length,
        source: "memory_cache",
        timeframe: "2 hours"
      });
    }
    
    // If memory is empty, fetch directly from Lighthouse storage but only last 2 hours
    const storedInsights = await insightsStorage.getRecentInsights(2); // 2 hours only
    
    res.json({
      success: true,
      insights: storedInsights,
      count: storedInsights.length,
      source: "lighthouse_storage",
      timeframe: "2 hours"
    });

  } catch (error) {
    console.error("Insights history error:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to get insights history" 
    });
  }
});

// Get latest insight only
router.get("/insights/latest", async (req, res) => {
  try {
    const insight = autoInsightsService.getLatestInsight();
    
    if (!insight) {
      return res.json({
        success: true,
        insight: {
          analysis: "No insights available yet. First analysis will be generated shortly.",
          timestamp: new Date().toISOString(),
          dataSources: { cryptoPrices: 0, predictionMarkets: 0, newsArticles: 0 },
          isFallback: true
        },
        message: "Waiting for first analysis"
      });
    }
    
    res.json({
      success: true,
      insight
    });

  } catch (error) {
    console.error("Latest insight error:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to get latest insight" 
    });
  }
});

// Auto-generated insights endpoint (backward compatible)
router.get("/insights/auto", async (req, res) => {
  try {
    const insight = autoInsightsService.getLatestInsight();
    
    if (!insight) {
      // Trigger generation if no insights exist
      const newInsight = await autoInsightsService.generateInsights();
      return res.json(newInsight);
    }
    
    res.json(insight);

  } catch (error) {
    console.error("Auto insights error:", error.message);
    
    res.json({ 
      analysis: "Market analysis is currently being updated. Please check back shortly for comprehensive insights.",
      timestamp: new Date().toISOString(),
      error: "Analysis temporarily unavailable"
    });
  }
});

// Get stored insights (those with IPFS/blockchain storage)
router.get("/insights/stored", async (req, res) => {
  try {
    const storedInsights = autoInsightsService.getStoredInsights();
    
    res.json({
      success: true,
      insights: storedInsights,
      count: storedInsights.length,
      message: `Found ${storedInsights.length} insights stored on IPFS/blockchain`
    });

  } catch (error) {
    console.error("Stored insights error:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to get stored insights" 
    });
  }
});

// Manual trigger for insights
router.post("/insights/generate", async (req, res) => {
  try {
    console.log('Manually triggering insights generation...');
    const insight = await autoInsightsService.triggerManualGeneration();
    
    res.json({
      success: true,
      message: 'Insights generated successfully',
      insight
    });

  } catch (error) {
    console.error("Manual insights error:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate insights" 
    });
  }
});

// Insights status with storage info
router.get("/insights/status", async (req, res) => {
  try {
    const status = autoInsightsService.getStatus();
    
    res.json({
      serviceStatus: status,
      isRunning: status.isRunning,
      insightsCount: status.insightsCount,
      storedCount: status.storedCount,
      lastUpdate: status.lastGenerated,
      nextUpdate: status.nextScheduled,
      storage: {
        ipfs: "Lighthouse",
        blockchain: "BNB Testnet",
        contract: process.env.CONTRACT_ADDRESS
      }
    });

  } catch (error) {
    console.error("Insights status error:", error.message);
    res.status(500).json({ error: "Failed to get insights status" });
  }
});

// ==================== CHAIN/STORAGE ROUTES ====================

// Blockchain contract information
router.get('/chain/info', async (req, res) => {
  try {
    const info = await getContractInfo();
    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    console.error('Chain info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all summaries stored on-chain
router.get('/chain/summaries', async (req, res) => {
  try {
    const summaries = await getAllSummaries();
    res.json({
      success: true,
      summaries,
      count: summaries.length
    });
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify a specific CID exists on-chain
router.get('/chain/verify/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const exists = await verifyCIDOnChain(cid);
    
    res.json({
      success: true,
      cid,
      existsOnChain: exists
    });
  } catch (error) {
    console.error('Verify CID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store a CID on-chain (manual endpoint)
router.post('/chain/store', async (req, res) => {
  try {
    const { cid } = req.body;
    
    if (!cid) {
      return res.status(400).json({
        success: false,
        error: "CID is required"
      });
    }

    const result = await storeCIDOnChain(cid);
    
    res.json({
      success: true,
      message: "CID stored on blockchain successfully",
      ...result
    });
  } catch (error) {
    console.error('Store CID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== AI QUERY ROUTES ====================

// Existing query endpoint 
router.post("/query", async (req, res) => {
  try {
    const { question, data } = req.body;

    if (!question && !data) {
      return res.status(400).json({ error: "Missing question or data" });
    }

    if (data) {
      const summary = await generateAISummary(data);
      return res.json({ answer: summary });
    }

    if (question) {
      const answer = await generateAIResponse(question);
      return res.json({ answer });
    }

  } catch (error) {
    console.error("AI query error:", error.message);
    
    res.json({ 
      answer: "I'm currently analyzing the market data. Please check the individual market cards for detailed probabilities and trends."
    });
  }
});

// Quick market summary endpoint
router.get("/summary/markets", async (req, res) => {
  try {
    const { default: polymarketService } = await import('../services/polymarket/polymarketService.js');
    const marketData = await polymarketService.getMarketData();
    const summary = await generateAISummary(marketData.markets || []);
    
    res.json({
      summary,
      timestamp: new Date().toISOString(),
      marketCount: marketData.markets?.length || 0
    });

  } catch (error) {
    console.error("Market summary error:", error.message);
    res.status(500).json({ error: "Summary generation failed" });
  }
});

export default router;