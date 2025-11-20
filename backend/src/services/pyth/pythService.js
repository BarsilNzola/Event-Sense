import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Try importing the correct Pyth client
let PriceServiceConnection;

try {
  const pythModule = await import('@pythnetwork/pyth-common-js');
  PriceServiceConnection = pythModule.PriceServiceConnection || 
                           pythModule.default?.PriceServiceConnection;
  if (PriceServiceConnection) {
    console.log('Pyth Common JS loaded successfully');
  } else {
    console.log('PriceServiceConnection not found in Pyth module');
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
    this.priceHistory = new Map(); // Store 24h price history
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
        const priceFeeds = await this.connection.getLatestPriceFeeds(priceIds);
        
        if (priceFeeds) {
          priceFeeds.forEach(feed => {
            if (!feed) return;
            
            const price = feed.getPriceUnchecked();
            const symbol = this.getSymbolFromPriceId(feed.id);
            
            const exponent = price.exponent !== undefined ? price.exponent : -8;
            const actualPrice = Number(price.price) * Math.pow(10, exponent);
            
            // Store current price
            this.priceFeeds.set(symbol, {
              price: price.price,
              confidence: price.confidence || price.price * 0.001,
              exponent: exponent,
              timestamp: price.publishTime,
              symbol: symbol,
              isMock: false
            });

            // Initialize 24h price history
            this.initialize24hHistory(symbol, actualPrice, price.publishTime);
          });
        }

        this.isConnected = true;
        console.log('Pyth Network connected successfully');
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

  // Initialize 24h price history
  initialize24hHistory(symbol, currentPrice, timestamp) {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, {
        currentPrice: currentPrice,
        price24hAgo: currentPrice, // Will be updated as we get more data
        timestamp24hAgo: timestamp,
        history: [{ price: currentPrice, timestamp: timestamp }]
      });
    }
  }

  // Update 24h price history
  update24hHistory(symbol, newPrice, timestamp) {
    if (!this.priceHistory.has(symbol)) {
      this.initialize24hHistory(symbol, newPrice, timestamp);
      return;
    }

    const history = this.priceHistory.get(symbol);
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 86400;

    // Update current price
    history.currentPrice = newPrice;
    history.history.push({ price: newPrice, timestamp: timestamp });

    // Keep only last 48 hours of data (safety buffer)
    const cutoffTime = Math.floor(Date.now() / 1000) - (86400 * 2);
    history.history = history.history.filter(point => point.timestamp > cutoffTime);

    // Find price closest to 24 hours ago
    const price24hAgo = this.find24hPrice(history.history, twentyFourHoursAgo);
    if (price24hAgo !== null) {
      history.price24hAgo = price24hAgo.price;
      history.timestamp24hAgo = price24hAgo.timestamp;
    }

    console.log(`24h history updated for ${symbol}: ${history.price24hAgo} -> ${newPrice}`);
  }

  // Find price closest to 24 hours ago
  find24hPrice(history, targetTimestamp) {
    if (history.length === 0) return null;

    let closest = history[0];
    let minDiff = Math.abs(history[0].timestamp - targetTimestamp);

    for (const point of history) {
      const diff = Math.abs(point.timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    // Only return if within 2 hours window
    return Math.abs(closest.timestamp - targetTimestamp) <= 7200 ? closest : null;
  }

  // Calculate 24h price change percentage
  calculate24hChange(currentPrice, price24hAgo) {
    if (!price24hAgo || price24hAgo === 0) return 0;
    
    const change = ((currentPrice - price24hAgo) / price24hAgo) * 100;
    return parseFloat(change.toFixed(2));
  }

  // Get price trend based on 24h change
  getPriceTrend(change) {
    if (Math.abs(change) < 0.1) return 'flat';
    return change > 0 ? 'up' : 'down';
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
          const actualPrice = Number(price.price) * Math.pow(10, exponent);
          
          // Update current price feed
          this.priceFeeds.set(symbol, {
            price: price.price,
            confidence: price.confidence || price.price * 0.001,
            exponent: exponent,
            timestamp: price.publishTime,
            symbol: symbol,
            isMock: false
          });

          // Update 24h history
          this.update24hHistory(symbol, actualPrice, price.publishTime);
        });
  
        console.log('Pyth prices updated with 24h tracking');
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
      
      const confidenceInterval = feed.confidence !== undefined && feed.confidence !== null 
        ? Number(feed.confidence) * Math.pow(10, exponent)
        : actualPrice * 0.001;

      return {
        symbol,
        price: actualPrice,
        confidence: confidenceInterval,
        timestamp: new Date(Number(feed.timestamp) * 1000),
        lastUpdated: feed.timestamp,
        isMock: feed.isMock || false
      };
      
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

  // Get 24h price change ONLY
  getPriceChange(symbol) {
    const priceData = this.getPrice(symbol);
    if (!priceData) {
      return { change: 0, trend: 'flat' };
    }

    const history = this.priceHistory.get(symbol);
    if (!history) {
      return { change: 0, trend: 'flat' };
    }

    const change = this.calculate24hChange(priceData.price, history.price24hAgo);
    const trend = this.getPriceTrend(change);
    
    console.log(`24h price change for ${symbol}:`, {
      currentPrice: priceData.price,
      price24hAgo: history.price24hAgo,
      change,
      trend
    });
    
    return { 
      change: change, 
      trend: trend,
      period: '24h'
    };
  }

  // Get all 24h price changes
  getAllPriceChanges() {
    const changes = {};
    for (const [symbol] of Object.entries(PYTH_PRICE_IDS)) {
      const changeData = this.getPriceChange(symbol);
      if (changeData) {
        changes[symbol] = changeData;
      }
    }
    return changes;
  }

  // Mock data methods (simplified for 24h only)
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

      // Initialize mock 24h history
      const basePrice = mockPrices[symbol] * (0.95 + Math.random() * 0.1); // ±5% variation
      this.priceHistory.set(symbol, {
        currentPrice: mockPrices[symbol],
        price24hAgo: basePrice,
        timestamp24hAgo: Math.floor(Date.now() / 1000) - 86400,
        history: [
          { price: basePrice, timestamp: Math.floor(Date.now() / 1000) - 86400 },
          { price: mockPrices[symbol], timestamp: Math.floor(Date.now() / 1000) }
        ]
      });
    });

    this.isConnected = true;
    console.log('Mock price data initialized (24h tracking)');
    this.startMockUpdates();
  }

  startMockUpdates() {
    setInterval(() => {
      this.priceFeeds.forEach((feed, symbol) => {
        if (feed.isMock && symbol !== 'USDC' && symbol !== 'DAI') {
          // Simulate 24h price movements
          const change = (Math.random() - 0.5) * 0.02; // ±1% change
          const currentPrice = Number(feed.price) * Math.pow(10, feed.exponent);
          const newPrice = currentPrice * (1 + change);
          
          this.priceFeeds.set(symbol, {
            ...feed,
            price: Math.floor(newPrice * Math.pow(10, -feed.exponent)),
            timestamp: Math.floor(Date.now() / 1000)
          });

          // Update 24h history for mock data
          const history = this.priceHistory.get(symbol);
          if (history) {
            history.currentPrice = newPrice;
            // For mock data, we simulate finding a 24h old price
            history.price24hAgo = newPrice * (0.98 + Math.random() * 0.04); // ±2% variation
          }
        }
      });
      console.log('Mock 24h prices updated');
    }, 30000);
  }
}

// Create and export singleton instance
export const pythService = new PythService();