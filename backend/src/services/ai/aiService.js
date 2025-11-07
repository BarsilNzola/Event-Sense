import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

console.log('=== AI SERVICE INITIALIZATION ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `SET (length: ${process.env.GEMINI_API_KEY.length})` : 'NOT SET');

// Simple Gemini initialization
let geminiClient = null;
let availableModel = "gemini-2.5-flash"; // Directly use the model you specified

// Direct test function
export const testGeminiConnection = async () => {
  console.log('🧪 Testing Gemini connection...');
  
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: 'GEMINI_API_KEY not found in environment' };
  }

  try {
    console.log('1. Creating GoogleGenerativeAI instance...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log(`2. Testing model: ${availableModel}`);
    const model = genAI.getGenerativeModel({ 
      model: availableModel,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10,
      }
    });
    
    console.log('3. Generating test content...');
    const result = await model.generateContent("Say 'OK'");
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ Model ${availableModel} works! Response: ${text}`);
    geminiClient = genAI;
    
    return { 
      success: true, 
      response: text,
      model: availableModel
    };
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    
    // If gemini-2.5-flash fails, try gemini-2.0-flash as fallback
    if (error.message.includes('not found') || error.message.includes('404')) {
      console.log('🔄 Trying gemini-2.0-flash as fallback...');
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const fallbackModel = "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ 
          model: fallbackModel,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          }
        });
        
        const result = await model.generateContent("Say 'OK'");
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Fallback model ${fallbackModel} works! Response: ${text}`);
        availableModel = fallbackModel;
        geminiClient = genAI;
        
        return { 
          success: true, 
          response: text,
          model: fallbackModel
        };
      } catch (fallbackError) {
        console.error('❌ Fallback model also failed:', fallbackError.message);
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      status: error.status
    };
  }
};

// Initialize on import
let initializationPromise = null;

async function initializeGemini() {
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    console.log('🚀 Initializing Gemini...');
    
    const testResult = await testGeminiConnection();
    
    if (testResult.success) {
      console.log('✅ Gemini initialized successfully with model:', availableModel);
      return true;
    } else {
      console.log('❌ Gemini initialization failed:', testResult.error);
      geminiClient = null;
      return false;
    }
  })();
  
  return initializationPromise;
}

// Start initialization immediately
initializeGemini().then(success => {
  console.log('🎯 Gemini initialization completed:', success);
});

export const generateAIResponse = async (question) => {
  console.log('🤖 generateAIResponse called with:', question.substring(0, 50) + '...');
  
  // Wait for initialization to complete
  const initialized = await initializeGemini();
  
  if (!initialized || !geminiClient) {
    console.log('🔴 Using fallback - Gemini not available');
    return "I'm currently analyzing prediction market trends. For detailed insights, check the market cards above.";
  }

  try {
    console.log(`🟢 Using ${availableModel} for question...`);
    const model = geminiClient.getGenerativeModel({ 
      model: availableModel,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.95,
      }
    });

    const prompt = `
You are EventSense AI, an expert assistant for prediction markets and crypto markets. Answer the following question helpfully and concisely.

Question: ${question}

Focus on prediction markets, probabilities, and market analysis. Keep your response under 3 sentences unless more detail is specifically requested.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini response received');
    return text;

  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    return "I'm currently focusing on analyzing the prediction market data shown above. Feel free to ask about specific trends or probabilities!";
  }
};

export const generateAISummary = async (marketData) => {
  // Wait for initialization to complete
  const initialized = await initializeGemini();
  
  if (!initialized || !geminiClient) {
    console.log('Using fallback summary');
    return generateFallbackSummary(marketData);
  }

  try {
    console.log(`🟢 Using ${availableModel} for market summary`);
    const model = geminiClient.getGenerativeModel({ 
      model: availableModel,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
        topP: 0.95,
      }
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
    
    console.log('✅ Gemini summary received successfully');
    return text;

  } catch (error) {
    console.error('Gemini summary error:', error.message);
    return generateFallbackSummary(marketData);
  }
};

export const generateComprehensiveAnalysis = async (priceData, marketData, newsData) => {
  // Try direct Gemini API first with a proper prompt
  try {
    console.log('🔄 Attempting direct Gemini API call...');
    
    const cryptoCount = Object.keys(priceData || {}).length;
    const marketCount = Array.isArray(marketData) ? marketData.length : 0;
    const newsCount = Array.isArray(newsData) ? newsData.length : 0;
    
    // Create a simple but meaningful prompt
    const prompt = `Provide a brief market analysis based on: ${cryptoCount} cryptocurrency prices, ${marketCount} prediction markets, and ${newsCount} news articles. Focus on current trends and short-term outlook.`;
    
    console.log('📝 Prompt for Gemini:', prompt);
    
    const geminiResult = await testDirectGeminiAPI(prompt);
    
    // Check if we got a valid response
    if (geminiResult.candidates && geminiResult.candidates[0] && geminiResult.candidates[0].content) {
      const geminiText = geminiResult.candidates[0].content.parts[0].text;
      if (geminiText && geminiText.length > 10) {
        console.log('✅ Direct Gemini API successful:', geminiText.substring(0, 100) + '...');
        return geminiText;
      }
    }
    
    console.log('❌ Direct Gemini API returned invalid response, using enhanced analysis');
    
  } catch (error) {
    console.error('❌ Direct Gemini API failed:', error.message);
  }
  
  // Fall back to our enhanced analysis
  console.log('🔄 Using enhanced analysis with AI-style formatting');
  return generateEnhancedFallback(priceData, marketData, newsData);
};

// Direct API call to Gemini
export const testDirectGeminiAPI = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('No API key');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200, // Increased slightly
            topP: 0.8
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Direct API error:', error);
    throw error;
  }
};

// Enhanced fallback with actual predictions
function generateEnhancedFallback(priceData, marketData, newsData) {
  const priceCount = Object.keys(priceData || {}).length;
  const marketCount = Array.isArray(marketData) ? marketData.length : 0;
  const newsCount = Array.isArray(newsData) ? newsData.length : 0;

  // Calculate actual metrics from data
  const markets = marketData || [];
  const avgProbability = markets.length > 0 
    ? (markets.reduce((sum, m) => sum + (m.probability || 0), 0) / markets.length * 100).toFixed(1)
    : 0;

  const upMarkets = markets.filter(m => m.trend === 'up').length;
  const downMarkets = markets.filter(m => m.trend === 'down').length;
  const stableMarkets = markets.filter(m => !m.trend || m.trend === 'flat').length;

  // Get top performing markets
  const topMarkets = markets
    .filter(m => m.probability > 0)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 3);

  // Get crypto with significant moves
  const cryptoMoves = Object.entries(priceData || {})
    .filter(([_, data]) => Math.abs(data.change24h || 0) > 2)
    .slice(0, 3);

  let analysis = `🔮 Market Analysis & Predictions - ${new Date().toLocaleTimeString()}\n\n`;
  
  analysis += `📊 DATA OVERVIEW:\n`;
  analysis += `• ${priceCount} cryptocurrencies tracked\n`;
  analysis += `• ${marketCount} prediction markets (${upMarkets} ↗️ ${downMarkets} ↘️ ${stableMarkets} ➡️)\n`;
  analysis += `• ${newsCount} news sources monitored\n\n`;
  
  analysis += `📈 MARKET INSIGHTS:\n`;
  analysis += `• Prediction markets show ${avgProbability}% average probability\n`;
  
  if (topMarkets.length > 0) {
    analysis += `• Highest conviction: ${topMarkets.map(m => `${(m.probability * 100).toFixed(1)}%`).join(', ')}\n`;
  }
  
  if (cryptoMoves.length > 0) {
    analysis += `• Notable moves: ${cryptoMoves.map(([sym, data]) => 
      `${sym} ${data.change24h > 0 ? '↑' : '↓'}${Math.abs(data.change24h)}%`
    ).join(', ')}\n`;
  }
  
  analysis += `\n🔮 PREDICTIONS & OUTLOOK:\n`;
  
  if (upMarkets > downMarkets) {
    analysis += `• Short-term: Moderately bullish sentiment across prediction markets\n`;
    analysis += `• Watch for: Correlation between crypto gains and market probabilities\n`;
  } else if (downMarkets > upMarkets) {
    analysis += `• Short-term: Cautious sentiment with some bearish indicators\n`;
    analysis += `• Watch for: News-driven volatility in both crypto and prediction markets\n`;
  } else {
    analysis += `• Short-term: Mixed signals with balanced market sentiment\n`;
    analysis += `• Watch for: Breakout opportunities in high-probability markets\n`;
  }
  
  analysis += `• Key Insight: ${newsCount > 10 ? 'High news volume may drive increased market activity' : 'Monitor emerging news for market-moving events'}\n`;

  return analysis;
}

// Keep your existing fallback functions
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