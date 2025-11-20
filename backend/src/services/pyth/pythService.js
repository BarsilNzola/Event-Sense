import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Looking for .env at:', path.resolve(__dirname, '../../.env'));

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Try importing the correct Pyth client
let PriceServiceConnection;

try {
  const pythModule = await import('@pythnetwork/pyth-common-js');
  
  // Try different possible export names
  PriceServiceConnection = pythModule.PriceServiceConnection || 
                           pythModule.default?.PriceServiceConnection;
  
  if (PriceServiceConnection) {
    console.log('Pyth Common JS loaded successfully');
  } else {
    console.log('PriceServiceConnection not found in Pyth module');
    console.log('Available exports:', Object.keys(pythModule));
    PriceServiceConnection = null;
  }
} catch (error) {
  console.error('Failed to load Pyth Common JS:', error);
  PriceServiceConnection = null;
}

// Common Pyth price feed IDs for major assets
const PYTH_PRICE_IDS = {
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  BNB: "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
  USDC: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  DAI: "0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd",
};

export class PythService {
    constructor() {
      this.connection = null;
      this.priceFeeds = new Map();
      this.priceHistory = new Map();
      this.isConnected = false;
      this.useMock = false;
      this.initializationPromise = null;
    }
  
    async initialize() {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }

      this.initializationPromise = (async () => {
        if (this.useMock || this.isConnected) {
          return;
        }

        try {
          console.log('Connecting to Pyth Network...');
          
          this.connection = new PriceServiceConnection("https://hermes.pyth.network");
          
          const priceIds = Object.values(PYTH_PRICE_IDS);
          console.log('Price IDs to fetch:', priceIds);
          
          const priceFeeds = await this.connection.getLatestPriceFeeds(priceIds);
          console.log('Raw price feeds received:', priceFeeds?.length || 0);
          
          if (priceFeeds) {
            priceFeeds.forEach(feed => {
              if (!feed) return;
              
              const price = feed.getPriceUnchecked();
              const symbol = this.getSymbolFromPriceId(feed.id);
              
              const exponent = price.exponent !== undefined ? price.exponent : -8;
              const confidence = price.confidence !== undefined ? price.confidence : 
                                price.price * 0.001;
              
              const actualPrice = Number(price.price) * Math.pow(10, exponent);
              
              // Store current price
              this.priceFeeds.set(symbol, {
                price: price.price,
                confidence: confidence,
                exponent: exponent,
                timestamp: price.publishTime,
                symbol: symbol,
                isMock: false
              });

              // Initialize price history
              this.initializePriceHistory(symbol, actualPrice, price.publishTime);
            });
          }

          this.isConnected = true;
          console.log('Pyth Network connected successfully');
          console.log(`Loaded ${this.priceFeeds.size} price feeds`);
          
          this.startPriceUpdates();
          
        } catch (error) {
          console.error('Pyth Network initialization failed:', error);
          console.log('Falling back to mock price data');
          this.useMock = true;
          this.initializeMockData();
        }
      })();

      return this.initializationPromise;
    }

  // Initialize price history for a symbol
  initializePriceHistory(symbol, currentPrice, timestamp) {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, {
        current: currentPrice,
        '1h': currentPrice, // Will be updated as we get more data
        '24h': currentPrice,
        timestamps: {
          current: timestamp,
          '1h': timestamp,
          '24h': timestamp
        },
        history: [] // Store price points for more accurate calculations
      });
    }
  }

  // Update price history with new price
  updatePriceHistory(symbol, newPrice, timestamp) {
    if (!this.priceHistory.has(symbol)) {
      this.initializePriceHistory(symbol, newPrice, timestamp);
      return;
    }

    const history = this.priceHistory.get(symbol);
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    const twentyFourHoursAgo = now - 86400;

    // Update current price
    const oldPrice = history.current;
    history.current = newPrice;
    history.timestamps.current = timestamp;

    // Add to history array (keep last 100 data points)
    history.history.push({
      price: newPrice,
      timestamp: timestamp
    });

    // Keep only last 100 entries
    if (history.history.length > 100) {
      history.history = history.history.slice(-100);
    }

    // Update 1h price if we have data from 1 hour ago
    const oneHourPrice = this.findHistoricalPrice(history.history, oneHourAgo);
    if (oneHourPrice !== null) {
      history['1h'] = oneHourPrice;
      history.timestamps['1h'] = oneHourPrice.timestamp;
    }

    // Update 24h price if we have data from 24 hours ago
    const twentyFourHourPrice = this.findHistoricalPrice(history.history, twentyFourHoursAgo);
    if (twentyFourHourPrice !== null) {
      history['24h'] = twentyFourHourPrice;
      history.timestamps['24h'] = twentyFourHourPrice.timestamp;
    }

    console.log(`Price history updated for ${symbol}: ${oldPrice} -> ${newPrice}`);
  }

  // Find historical price closest to a specific timestamp
  findHistoricalPrice(history, targetTimestamp) {
    if (history.length === 0) return null;

    // Find the price point closest to the target timestamp
    let closest = history[0];
    let minDiff = Math.abs(history[0].timestamp - targetTimestamp);

    for (const point of history) {
      const diff = Math.abs(point.timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    // Only return if within reasonable time window (15 minutes)
    return Math.abs(closest.timestamp - targetTimestamp) <= 900 ? closest.price : null;
  }

  // Calculate price change percentage
  calculatePriceChange(currentPrice, previousPrice) {
    if (!previousPrice || previousPrice === 0) return 0;
    
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;
    return parseFloat(change.toFixed(2));
  }

  // Get price trend based on change percentage
  getPriceTrend(change) {
    if (Math.abs(change) < 0.1) return 'flat';
    return change > 0 ? 'up' : 'down';
  }

  // Initialize mock data
  initializeMockData() {
    const mockPrices = {
      BTC: 45000 + Math.random() * 5000,
      ETH: 2500 + Math.random() * 500,
      SOL: 100 + Math.random() * 50,
      BNB: 300 + Math.random() * 100,
      USDC: 1.00,
      DAI: 1.00,
    };

    Object.entries(PYTH_PRICE_IDS).forEach(([symbol]) => {
      const price = Math.floor(mockPrices[symbol] * 1e6);
      this.priceFeeds.set(symbol, {
        price: price,
        confidence: Math.floor(mockPrices[symbol] * 10),
        exponent: -6,
        timestamp: Math.floor(Date.now() / 1000),
        symbol: symbol,
        isMock: true
      });

      // Initialize mock history with realistic changes
      this.initializeMockHistory(symbol, mockPrices[symbol]);
    });

    this.isConnected = true;
    console.log('Mock price data initialized');
    this.startMockUpdates();
  }

  // Initialize realistic mock history
  initializeMockHistory(symbol, currentPrice) {
    const now = Math.floor(Date.now() / 1000);
    const basePrice = currentPrice * (0.9 + Math.random() * 0.2); // ±10% variation
    
    this.priceHistory.set(symbol, {
      current: currentPrice,
      '1h': basePrice * (0.995 + Math.random() * 0.01), // ±0.5% from base
      '24h': basePrice * (0.98 + Math.random() * 0.04),  // ±2% from base
      timestamps: {
        current: now,
        '1h': now - 3600,
        '24h': now - 86400
      },
      history: [
        { price: basePrice, timestamp: now - 86400 },
        { price: basePrice * (0.99 + Math.random() * 0.02), timestamp: now - 43200 },
        { price: basePrice * (0.995 + Math.random() * 0.01), timestamp: now - 3600 },
        { price: currentPrice, timestamp: now }
      ]
    });
  }

  // Get symbol from price ID
  getSymbolFromPriceId(priceId) {
    let searchId = priceId.toString();
    if (searchId.startsWith('0x')) {
      searchId = searchId.substring(2);
    }
    
    for (const [symbol, id] of Object.entries(PYTH_PRICE_IDS)) {
      const normalizedId = id.startsWith('0x') ? id.substring(2) : id;
      if (normalizedId === searchId) {
        return symbol;
      }
    }
    
    console.log('Unknown price ID:', searchId);
    return 'UNKNOWN';
  }

  // Start periodic price updates
  startPriceUpdates() {
    if (this.useMock) return;
  
    setInterval(async () => {
      try {
        const priceIds = Object.values(PYTH_PRICE_IDS);
        const priceFeeds = await this.connection.getLatestPriceFeeds(priceIds);
        
        priceFeeds.forEach(feed => {
          const price = feed.getPriceUnchecked();
          const symbol = this.getSymbolFromPriceId(feed.id);
          
          const exponent = price.exponent !== undefined ? price.exponent : -8;
          const confidence = price.confidence !== undefined ? price.confidence : 
                            price.price * 0.001;
          
          const actualPrice = Number(price.price) * Math.pow(10, exponent);
          
          // Update current price feed
          this.priceFeeds.set(symbol, {
            price: price.price,
            confidence: confidence,
            exponent: exponent,
            timestamp: price.publishTime,
            symbol: symbol,
            isMock: false
          });

          // Update price history for change calculations
          this.updatePriceHistory(symbol, actualPrice, price.publishTime);
        });
  
        console.log('Pyth prices updated with real-time data');
      } catch (error) {
        console.error('Pyth price update failed:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  // Get current price for a symbol
  getPrice(symbol) {
    const feed = this.priceFeeds.get(symbol);
    if (!feed) {
      console.log(`No price feed found for symbol: ${symbol}`);
      return null;
    }
  
    try {
      const exponent = feed.exponent !== undefined ? feed.exponent : -8;
      const actualPrice = Number(feed.price) * Math.pow(10, exponent);
      
      let confidenceInterval;
      if (feed.confidence !== undefined && feed.confidence !== null) {
        confidenceInterval = Number(feed.confidence) * Math.pow(10, exponent);
      } else {
        confidenceInterval = actualPrice * 0.001;
      }
  
      const priceData = {
        symbol,
        price: actualPrice,
        confidence: confidenceInterval,
        timestamp: new Date(Number(feed.timestamp) * 1000),
        lastUpdated: feed.timestamp,
        isMock: feed.isMock || false
      };
  
      return priceData;
      
    } catch (error) {
      console.error(`Error processing price for ${symbol}:`, error);
      return null;
    }
  }

  // Get all prices
  getAllPrices() {
    const prices = {};
    for (const [symbol] of Object.entries(PYTH_PRICE_IDS)) {
      const priceData = this.getPrice(symbol);
      if (priceData) {
        prices[symbol] = priceData;
      }
    }
    return prices;
  }

  // Get real price change based on historical data
  getPriceChange(symbol, period = '24h') {
    const priceData = this.getPrice(symbol);
    if (!priceData) {
      console.log(`No price data found for ${symbol}`);
      return { change: 0, trend: 'flat' };
    }
  
    const history = this.priceHistory.get(symbol);
    if (!history) {
      console.log(`No history found for ${symbol}`);
      return { change: 0, trend: 'flat' };
    }
  
    let previousPrice;
    let change;
  
    switch (period) {
      case '1h':
        previousPrice = history['1h'];
        change = this.calculatePriceChange(priceData.price, previousPrice);
        break;
      case '24h':
        previousPrice = history['24h'];
        change = this.calculatePriceChange(priceData.price, previousPrice);
        break;
      default:
        // For other periods, use the oldest available data
        if (history.history.length > 1) {
          const oldestPrice = history.history[0].price;
          change = this.calculatePriceChange(priceData.price, oldestPrice);
        } else {
          change = 0;
        }
    }
  
    const trend = this.getPriceTrend(change);
    
    console.log(`Price change for ${symbol}:`, {
      currentPrice: priceData.price,
      previousPrice,
      change,
      trend,
      period
    });
    
    // Return the exact format expected by frontend
    return { 
      change: change, 
      trend: trend
    };
  }

  // Get detailed price history for a symbol
  getPriceHistory(symbol) {
    return this.priceHistory.get(symbol) || null;
  }

  // Get all price changes
  getAllPriceChanges(period = '24h') {
    const changes = {};
    for (const [symbol] of Object.entries(PYTH_PRICE_IDS)) {
      const changeData = this.getPriceChange(symbol, period);
      if (changeData) {
        changes[symbol] = changeData;
      }
    }
    return changes;
  }
}

export const pythService = new PythService();