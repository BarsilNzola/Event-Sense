import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Looking for .env at:', path.resolve(__dirname, '../../../../.env'));

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

console.log('GEMINI_API_KEY in aiService:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');

// Initialize Gemini
let genAI = null;
let availableModel = null;
let modelInitialized = false;

// Initialize Gemini AI (called on first use)
async function initializeGemini() {
  if (modelInitialized) return;
  
  if (process.env.GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log("Gemini AI initialized successfully");
      
      // Test available models
      await initializeModel();
      modelInitialized = true;
    } catch (err) {
      console.error("Gemini initialization failed:", err.message);
      genAI = null;
      modelInitialized = true;
    }
  } else {
    console.log("GEMINI_API_KEY not set; using local fallback only");
    modelInitialized = true;
  }
}

async function initializeModel() {
  if (!genAI) return;
  
  try {
    // Try to list available models first
    console.log('Fetching available models...');
    const models = await genAI.listModels();
    console.log('Available models:', models.map(m => m.name));
    
    // Try different model names in order of preference
    const modelCandidates = [
      "gemini-pro",
      "models/gemini-pro",
      "gemini-1.0-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    
    for (const modelName of modelCandidates) {
      try {
        console.log(`Testing model: ${modelName}`);
        // Test if model exists by making a simple request
        const model = genAI.getGenerativeModel({ model: modelName });
        // Test with a very simple prompt
        const testResult = await model.generateContent("Hello");
        await testResult.response;
        availableModel = modelName;
        console.log(`✅ Using model: ${availableModel}`);
        break;
      } catch (error) {
        console.log(`❌ Model ${modelName} not available: ${error.message}`);
      }
    }
    
    if (!availableModel) {
      console.log("No compatible Gemini models found. Using fallback mode.");
      genAI = null;
    }
  } catch (error) {
    console.error("Error detecting models:", error.message);
    genAI = null;
  }
}

export const generateComprehensiveAnalysis = async (priceData, marketData, newsData) => {
  // Initialize on first use
  if (!modelInitialized) {
    await initializeGemini();
  }

  try {
    if (!genAI || !availableModel) {
      console.log('Gemini not available, using fallback for comprehensive analysis');
      return generateFallbackAnalysis(priceData, marketData, newsData);
    }

    console.log(`Using ${availableModel} for comprehensive market analysis`);
    
    const model = genAI.getGenerativeModel({
      model: availableModel,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400,
        topP: 0.95,
      },
    });

    const prompt = `
You are EventSense AI, an expert analyst for prediction markets and crypto markets. Analyze this comprehensive data and provide insights that connect crypto prices, prediction markets, and news events.

CRYPTO PRICES (from Pyth Network):
${JSON.stringify(priceData, null, 2)}

PREDICTION MARKETS (from Polymarket):
${JSON.stringify(marketData, null, 2)}

RECENT NEWS:
${JSON.stringify(newsData, null, 2)}

Provide 3-4 key insights focusing on:
1. How news events might affect prediction markets and crypto prices
2. Correlation between crypto trends and market predictions
3. Potential trading opportunities or risks
4. Notable patterns or anomalies

Keep the response professional, data-driven, and actionable. Focus on connecting the different data sources.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini comprehensive analysis received successfully');
    return text;

  } catch (error) {
    console.error("Gemini AI failed:", error.message);
    return generateFallbackAnalysis(priceData, marketData, newsData);
  }
};

export const generateAISummary = async (marketData) => {
  // Initialize on first use
  if (!modelInitialized) {
    await initializeGemini();
  }

  try {
    if (!genAI || !availableModel) {
      console.log('Gemini not available, using fallback for summary');
      return generateFallbackSummary(marketData);
    }

    console.log(`Using ${availableModel} for market analysis`);
    
    const model = genAI.getGenerativeModel({
      model: availableModel,
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
    
    console.log('Gemini response received successfully');
    return text;

  } catch (error) {
    console.error("Gemini AI failed:", error.message);
    return generateFallbackSummary(marketData);
  }
};

export const generateAIResponse = async (question) => {
  // Initialize on first use
  if (!modelInitialized) {
    await initializeGemini();
  }

  try {
    if (!genAI || !availableModel) {
      console.log('Gemini not available, using fallback for question');
      return "I'm currently analyzing prediction market trends. For detailed insights, check the market cards above.";
    }

    console.log(`Using ${availableModel} for question`);
    
    const model = genAI.getGenerativeModel({
      model: availableModel,
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
    
    console.log('Gemini question response received');
    return text;

  } catch (error) {
    console.error("Gemini question failed:", error.message);
    return "I'm currently focusing on analyzing the prediction market data shown above. Feel free to ask about specific trends or probabilities!";
  }
};

// Your existing fallback functions remain the same...
function generateFallbackAnalysis(priceData, marketData, newsData) {
  const priceCount = Object.keys(priceData || {}).length;
  const marketCount = Array.isArray(marketData) ? marketData.length : 0;
  const newsCount = Array.isArray(newsData) ? newsData.length : 0;

  let analysis = "Market Analysis Summary\n\n";
  analysis += `Tracking ${priceCount} crypto assets and ${marketCount} prediction markets.\n`;
  analysis += `${newsCount} recent news articles monitored for market-moving events.\n\n`;

  if (priceCount > 0) {
    analysis += "Crypto markets show active trading across major assets. ";
  }

  if (marketCount > 0) {
    const avgProbability = marketData.reduce((sum, m) => sum + (m.probability || 0), 0) / marketCount;
    analysis += `Prediction markets average ${(avgProbability * 100).toFixed(1)}% probability across ${marketCount} active markets. `;
  }

  if (newsCount > 0) {
    analysis += "Recent news events may create volatility opportunities in prediction markets.";
  }

  analysis += "\n\nMonitor specific asset prices and market probabilities for detailed insights.";

  return analysis;
}

function generateFallbackSummary(marketData) {
  if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
    return "No market data available for analysis. Check back later for market insights.";
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
  if (upTrends > downTrends + 3) {
    sentiment = "strongly bullish";
  } else if (upTrends > downTrends) {
    sentiment = "bullish";
  } else if (downTrends > upTrends + 3) {
    sentiment = "strongly bearish";
  } else if (downTrends > upTrends) {
    sentiment = "bearish";
  }

  // Get top markets
  const topMarkets = marketData
    .filter(m => m.probability > 0.1)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 3);

  let summary = "AI Market Analysis\n\n";
  summary += `Overview: ${totalMarkets} markets tracking various predictions\n`;
  summary += `Sentiment: ${sentiment} (${upTrends} rising, ${downTrends} falling)\n`;
  summary += `Average Probability: ${avgProbability}%\n`;
  
  if (totalVolume > 1000) {
    summary += `Volume: $${(totalVolume / 1000000).toFixed(2)}M\n`;
  }
  
  if (totalLiquidity > 1000) {
    summary += `Liquidity: $${(totalLiquidity / 1000).toFixed(0)}K\n`;
  }

  if (topMarkets.length > 0) {
    summary += `\nKey Predictions:\n`;
    topMarkets.forEach((market, index) => {
      const prob = (market.probability * 100).toFixed(1);
      const trend = market.trend === 'up' ? 'UP' : market.trend === 'down' ? 'DOWN' : 'FLAT';
      const change = market.change ? ` (${market.change > 0 ? '+' : ''}${market.change}%)` : '';
      summary += `${index + 1}. ${trend} ${market.question.slice(0, 35)}... - ${prob}%${change}\n`;
    });
  }

  // Add insight based on data
  if (parseFloat(avgProbability) > 70) {
    summary += `\nInsight: Markets show strong conviction in current predictions.`;
  } else if (parseFloat(avgProbability) < 30) {
    summary += `\nInsight: Markets indicate uncertainty with lower probability outcomes.`;
  } else {
    summary += `\nInsight: Balanced market sentiment with diverse probability ranges.`;
  }

  return summary;
}