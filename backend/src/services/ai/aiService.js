import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
};
