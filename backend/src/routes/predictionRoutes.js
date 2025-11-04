import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/analyze", async (req, res) => {
  try {
    const response = await axios.get(
      "https://gamma-api.polymarket.com/markets?limit=5"
    );

    console.log("🔍 Polymarket raw response keys:", Object.keys(response.data));
    console.log("🔍 Sample response snippet:", JSON.stringify(response.data, null, 2).slice(0, 500));

    const marketsArr =
      response.data?.data?.markets ||
      response.data?.markets ||
      response.data; // handle multiple shapes

    if (!Array.isArray(marketsArr)) {
      console.error("❌ Unexpected Polymarket response format");
      return res.status(500).json({ error: "Unexpected Polymarket API response" });
    }

    const markets = marketsArr.map((m) => ({
      id: m.id,
      question: m.question,
      probability: m.outcomes?.[0]?.price ?? 0.5,
      volume: m.volume ?? 0,
      trend: (m.outcomes?.[0]?.price_change_24h ?? 0) > 0 ? "up" : "down",
      change: ((m.outcomes?.[0]?.price_change_24h ?? 0) * 100).toFixed(2),
      history: [
        { date: "Today", probability: m.outcomes?.[0]?.price },
        {
          date: "24h ago",
          probability:
            (m.outcomes?.[0]?.price ?? 0) -
            (m.outcomes?.[0]?.price_change_24h ?? 0),
        },
      ],
    }));

    res.json({ summary: "Latest prediction markets from Polymarket", markets });
  } catch (error) {
    console.error("❌ Error fetching markets:", error.message);
    if (error.response) {
      console.error("❌ Polymarket API status:", error.response.status);
      console.error("❌ Polymarket API data:", error.response.data);
    }
    res.status(500).json({ error: "Could not fetch Polymarket data" });
  }
});

export default router;
