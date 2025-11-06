import express from "express";
import { newsService } from "../services/news/newsService.js";

const router = express.Router();

// Start auto-refresh
newsService.startAutoRefresh();

// Get all news
router.get("/", async (req, res) => {
  try {
    const data = await newsService.getNews();
    res.json(data);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: error.message });
  }
});

// Force refresh
router.get("/refresh", async (req, res) => {
  try {
    const data = await newsService.forceRefresh();
    res.json({
      ...data,
      note: "News cache forcefully refreshed"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status
router.get("/status", (req, res) => {
  try {
    const status = newsService.getCacheStatus();
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;