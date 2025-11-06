import express from "express";
import { generateAISummary, generateAIResponse } from "../services/ai/aiService.js";
import { autoInsightsService } from "../services/ai/autoInsightsService.js";

const router = express.Router();

// Auto-generated insights endpoint - now just serves cached results
router.get("/insights/auto", async (req, res) => {
  try {
    // This now just returns the cached insights from autoInsightsService
    const insights = await autoInsightsService.getLatestInsights();
    
    res.json(insights);

  } catch (error) {
    console.error("Auto insights error:", error.message);
    
    res.json({ 
      analysis: "Market analysis is currently being updated. Please check back shortly for comprehensive insights.",
      timestamp: new Date().toISOString(),
      error: "Analysis temporarily unavailable"
    });
  }
});

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

//status endpoint for auto-insights
router.get("/insights/status", async (req, res) => {
  try {
    const status = autoInsightsService.getStatus();
    const latestInsights = await autoInsightsService.getLatestInsights();
    
    res.json({
      serviceStatus: status,
      latestInsights: {
        timestamp: latestInsights.timestamp,
        dataSources: latestInsights.dataSources,
        hasAnalysis: !!latestInsights.analysis && !latestInsights.isFallback
      }
    });

  } catch (error) {
    console.error("Insights status error:", error.message);
    res.status(500).json({ error: "Failed to get insights status" });
  }
});

export default router;