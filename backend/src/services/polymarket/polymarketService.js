import axios from "axios";

export const fetchPolymarketData = async () => {
  try {
    const response = await axios.get("https://api.polymarket.com/markets");
    // Simplify to keep only key details
    const formatted = response.data.markets.slice(0, 5).map(m => ({
      question: m.question,
      volume: m.volume,
      prices: m.outcomes.map(o => o.price),
      category: m.category
    }));
    return formatted;
  } catch (error) {
    console.error("Polymarket API error:", error);
    return [];
  }
};
