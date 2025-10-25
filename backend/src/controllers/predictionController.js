import { fetchPolymarketData } from "../services/polymarket/polymarketService.js";
import { generateAISummary } from "../services/ai/aiService.js";
import { uploadToLighthouse } from "../services/lighthouse/lighthouseService.js";
import { supabase } from "../utils/supabaseClient.js";
import { storeCIDOnChain } from "../services/chain/chainService.js";

export const processPredictions = async (req, res) => {
  try {
    const markets = await fetchPolymarketData();
    if (!markets || !markets.length) return res.status(400).json({ error: "No markets found" });

    // 1) AI summary
    const summary = await generateAISummary(markets);

    // 2) Upload to Lighthouse (IPFS)
    const cid = await uploadToLighthouse({ markets, summary, timestamp: new Date().toISOString() });
    if (!cid) throw new Error("Failed to upload to Lighthouse");

    // 3) Store CID on-chain
    const chainResult = await storeCIDOnChain(cid);
    const txHash = chainResult?.txHash || chainResult?.receipt?.transactionHash || null;

    // 4) Store record in Supabase (with cid + txHash)
    const { error } = await supabase
      .from("predictions")
      .insert([
        {
          market_name: "Polymarket Snapshot",
          ai_summary: summary,
          lighthouse_cid: cid,
          onchain_tx: txHash
        },
      ]);

    if (error) {
      console.warn("Supabase insert error:", error);
      // don't fail the entire flow on DB error — but return partial result
    }

    // 5) Respond to client
    res.json({
      message: "Prediction data summarized, pinned, and stored on-chain 🚀",
      summary,
      cid,
      txHash
    });
  } catch (err) {
    console.error("Error in processPredictions:", err);
    res.status(500).json({ error: err.message });
  }
};
