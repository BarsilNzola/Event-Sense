import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/analyze", async (req, res) => {
  try {
    const { data } = await axios.get("https://gamma-api.polymarket.com/markets?limit=5");

    const markets = data.markets.map((m) => ({
      id: m.id,
      question: m.question,
      probability: m.outcomes?.[0]?.price || 0.5,
      volume: m.volume,
      trend: m.outcomes?.[0]?.price_change_24h > 0 ? "up" : "down",
      change: (m.outcomes?.[0]?.price_change_24h * 100).toFixed(2),
      history: [
        { date: "Today", probability: m.outcomes?.[0]?.price },
        { date: "24h ago", probability: m.outcomes?.[0]?.price - m.outcomes?.[0]?.price_change_24h },
      ],
    }));

    res.json({ summary: "Latest prediction markets from Polymarket", markets });
  } catch (error) {
    console.error("Error fetching markets:", error);
    res.status(500).json({ error: "Could not fetch Polymarket data" });
  }
});

export default router;
