import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export const generateAISummary = async (marketData) => {
  const prompt = `
Analyze this prediction market data and summarize key trends:
${JSON.stringify(marketData, null, 2)}

Your response should include:
- Overall market sentiment
- Key probabilities
- Notable changes
- Short AI insight (2-3 sentences)
`;

  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return (
      response.data?.[0]?.generated_text ||
      "No response generated from AI model."
    );
  } catch (error) {
    console.error("AI summary generation failed:", error.response?.data || error.message);
    throw new Error("AI summary generation failed");
  }
};
