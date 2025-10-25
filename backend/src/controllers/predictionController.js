import { fetchPolymarketData } from "../services/polymarket/polymarketService.js";
import { generateAISummary } from "../services/ai/aiService.js";
import { uploadToLighthouse } from "../services/lighthouse/lighthouseService.js";
import { supabase } from "../utils/supabaseClient.js";

export const processPredictions = async (req, res) => {
  try {
    const markets = await fetchPolymarketData();
    if (!markets.length) return res.status(400).json({ error: "No markets found" });

    const summary = await generateAISummary(markets);
    const cid = await uploadToLighthouse({ markets, summary });

    const { error } = await supabase
      .from("predictions")
      .insert([{ market_name: "Polymarket Snapshot", ai_summary: summary, lighthouse_cid: cid }]);

    if (error) throw error;

    res.json({
      message: "Prediction data summarized successfully 🚀",
      summary,
      cid
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
};
