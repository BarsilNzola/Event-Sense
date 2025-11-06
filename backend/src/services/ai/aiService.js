import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Looking for .env at:', path.resolve(__dirname, '../../../.env'));

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Initialize Gemini (same pattern as your working code)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini AI initialized successfully");
  } catch (err) {
    console.error("❌ Gemini initialization failed:", err.message);
    genAI = null;
  }
} else {
  console.log("⚠️ GEMINI_API_KEY not set; using local fallback only");
}

export const generateAISummary = async (marketData) => {
  try {
    if (!genAI) {
      console.log('❌ Gemini not available, using fallback');
      return generateFallbackSummary(marketData);
    }

    console.log('🔑 Using Gemini 1.5 Flash for market analysis');
    
    // Use the exact same model that worked in your other project
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
        topP: 0.95,
      },
    });

    const prompt = `
You are EventSense AI, an expert analyst for prediction markets. Analyze this market data and provide a concise 2-3 sentence summary focusing on:

1. Overall market sentiment (bullish/bearish/mixed)
2. Key probability trends and notable predictions
3. Any interesting observations or patterns

Market Data:
${JSON.stringify(marketData, null, 2)}

Keep the response professional, insightful, and easy to understand. Focus on the most important trends and probabilities.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini response received successfully');
    return text;

  } catch (error) {
    console.error("❌ Gemini AI failed:", error.message);
    console.error("Full error:", error);
    return generateFallbackSummary(marketData);
  }
};

export const generateAIResponse = async (question) => {
  try {
    if (!genAI) {
      return "I'm currently analyzing prediction market trends. For detailed insights, check the market cards above.";
    }

    console.log('🔑 Using Gemini 1.5 Flash for question');
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.95,
      },
    });

    const prompt = `
You are EventSense AI, an expert assistant for prediction markets. Answer the following question helpfully and concisely.

Question: ${question}

Focus on prediction markets, probabilities, and market analysis. Keep your response under 3 sentences unless more detail is specifically requested.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini question response received');
    return text;

  } catch (error) {
    console.error("❌ Gemini question failed:", error.message);
    return "I'm currently focusing on analyzing the prediction market data shown above. Feel free to ask about specific trends or probabilities!";
  }
};

// Enhanced fallback function
function generateFallbackSummary(marketData) {
  if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
    return "📊 No market data available for analysis. Check back later for market insights!";
  }

  const upTrends = marketData.filter(m => m.trend === 'up').length;
  const downTrends = marketData.filter(m => m.trend === 'down').length;
  const stableTrends = marketData.filter(m => !m.trend || m.trend === 'flat').length;
  const totalMarkets = marketData.length;
  
  const probabilities = marketData.map(m => m.probability || 0).filter(p => p > 0);
  const avgProbability = probabilities.length > 0 
    ? (probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length * 100).toFixed(1)
    : "0";

  const totalVolume = marketData.reduce((sum, m) => sum + (m.volume || 0), 0);
  const totalLiquidity = marketData.reduce((sum, m) => sum + (m.liquidity || 0), 0);

  let sentiment = "mixed";
  let sentimentEmoji = "⚖️";
  if (upTrends > downTrends + 3) {
    sentiment = "strongly bullish";
    sentimentEmoji = "🚀";
  } else if (upTrends > downTrends) {
    sentiment = "bullish";
    sentimentEmoji = "📈";
  } else if (downTrends > upTrends + 3) {
    sentiment = "strongly bearish";
    sentimentEmoji = "🔻";
  } else if (downTrends > upTrends) {
    sentiment = "bearish";
    sentimentEmoji = "📉";
  }

  // Get top markets
  const topMarkets = marketData
    .filter(m => m.probability > 0.1)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 3);

  let summary = `${sentimentEmoji} **AI Market Analysis**\n\n`;
  summary += `📊 **Overview**: ${totalMarkets} markets tracking various predictions\n`;
  summary += `🎯 **Sentiment**: ${sentiment} (${upTrends} rising, ${downTrends} falling)\n`;
  summary += `📈 **Avg Probability**: ${avgProbability}%\n`;
  
  if (totalVolume > 1000) {
    summary += `💰 **Volume**: $${(totalVolume / 1000000).toFixed(2)}M\n`;
  }
  
  if (totalLiquidity > 1000) {
    summary += `🏦 **Liquidity**: $${(totalLiquidity / 1000).toFixed(0)}K\n`;
  }

  if (topMarkets.length > 0) {
    summary += `\n🔮 **Key Predictions**:\n`;
    topMarkets.forEach((market, index) => {
      const prob = (market.probability * 100).toFixed(1);
      const trend = market.trend === 'up' ? '📈' : market.trend === 'down' ? '📉' : '➡️';
      const change = market.change ? ` (${market.change > 0 ? '+' : ''}${market.change}%)` : '';
      summary += `${index + 1}. ${trend} ${market.question.slice(0, 35)}... - ${prob}%${change}\n`;
    });
  }

  // Add insight based on data
  if (parseFloat(avgProbability) > 70) {
    summary += `\n💡 **Insight**: Markets show strong conviction in current predictions.`;
  } else if (parseFloat(avgProbability) < 30) {
    summary += `\n💡 **Insight**: Markets indicate uncertainty with lower probability outcomes.`;
  } else {
    summary += `\n💡 **Insight**: Balanced market sentiment with diverse probability ranges.`;
  }

  return summary;
}