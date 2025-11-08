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
      this.isConnected = false;
      this.useMock = false;
      this.initializationPromise = null; // Track initialization
    }
  
    async initialize() {
      // Prevent multiple initializations
      if (this.initializationPromise) {
        return this.initializationPromise;
      }
  
      this.initializationPromise = (async () => {
        if (this.useMock || this.isConnected) {
          return; // Already initialized or using mock
        }
  
        try {
          console.log('Connecting to Pyth Network...');
          
          this.connection = new PriceServiceConnection("https://hermes.pyth.network");
          
          // Get all price feeds at once
          const priceIds = Object.values(PYTH_PRICE_IDS);
          console.log('Price IDs to fetch:', priceIds);
          
          const priceFeeds = await this.connection.getLatestPriceFeeds(priceIds);
          console.log('Raw price feeds received:', priceFeeds?.length || 0);
          
          // Store price feeds
          if (priceFeeds) {
            priceFeeds.forEach(feed => {
              if (!feed) {
                console.log('Empty feed received');
                return;
              }
              
              const price = feed.getPriceUnchecked();
              const symbol = this.getSymbolFromPriceId(feed.id);
              
              // Handle undefined values with sensible defaults
              const exponent = price.exponent !== undefined ? price.exponent : -8;
              const confidence = price.confidence !== undefined ? price.confidence : 
                                price.price * 0.001; // Default to 0.1% of price
              
              console.log(`Processing ${symbol}:`, {
                price: price.price,
                exponent: exponent,
                confidence: confidence,
                timestamp: price.publishTime
              });
              
              this.priceFeeds.set(symbol, {
                price: price.price,
                confidence: confidence,
                exponent: exponent,
                timestamp: price.publishTime,
                symbol: symbol,
                isMock: false
              });
            });
          }
  
          this.isConnected = true;
          console.log('Pyth Network connected successfully');
          console.log(`Loaded ${this.priceFeeds.size} price feeds`);
          console.log('Available symbols:', Array.from(this.priceFeeds.keys()));
          
          // Set up periodic updates (every 30 seconds)
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

  // Initialize mock data for demo purposes
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
      this.priceFeeds.set(symbol, {
        price: Math.floor(mockPrices[symbol] * 1e6), // Simulate 6 decimal places
        confidence: Math.floor(mockPrices[symbol] * 10), // Small confidence interval
        exponent: -6, // 6 decimal places
        timestamp: Math.floor(Date.now() / 1000),
        symbol: symbol,
        isMock: true
      });
    });

    this.isConnected = true;
    console.log('Mock price data initialized');
    
    // Update mock prices periodically to simulate market movement
    this.startMockUpdates();
  }

  // Update mock prices to simulate market movement
  startMockUpdates() {
    setInterval(() => {
      this.priceFeeds.forEach((feed, symbol) => {
        if (feed.isMock && symbol !== 'USDC' && symbol !== 'DAI') {
          // Simulate small price movements
          const change = (Math.random() - 0.5) * 0.02; // ±1% change
          const currentPrice = Number(feed.price) * Math.pow(10, feed.exponent);
          const newPrice = currentPrice * (1 + change);
          
          this.priceFeeds.set(symbol, {
            ...feed,
            price: Math.floor(newPrice * Math.pow(10, -feed.exponent)),
            timestamp: Math.floor(Date.now() / 1000)
          });
        }
      });
      console.log('Mock prices updated');
    }, 30000);
  }

  // Get symbol from price ID
  getSymbolFromPriceId(priceId) {
    // Convert priceId to string and normalize
    let searchId = priceId.toString();
    
    // Remove any '0x' prefix if present for comparison
    if (searchId.startsWith('0x')) {
      searchId = searchId.substring(2);
    }
    
    for (const [symbol, id] of Object.entries(PYTH_PRICE_IDS)) {
      // Remove '0x' prefix from our stored IDs for comparison
      const normalizedId = id.startsWith('0x') ? id.substring(2) : id;
      
      if (normalizedId === searchId) {
        return symbol;
      }
    }
    
    console.log('Unknown price ID:', searchId);
    console.log('Available IDs:', Object.values(PYTH_PRICE_IDS).map(id => 
      id.startsWith('0x') ? id.substring(2) : id
    ));
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
          
          // Use the same logic as in initialize
          const exponent = price.exponent !== undefined ? price.exponent : -8;
          const confidence = price.confidence !== undefined ? price.confidence : 
                            price.price * 0.001;
          
          this.priceFeeds.set(symbol, {
            price: price.price,
            confidence: confidence,
            exponent: exponent,
            timestamp: price.publishTime,
            symbol: symbol,
            isMock: false
          });
        });
  
        console.log('Pyth prices updated');
      } catch (error) {
        console.error('Pyth price update failed:', error);
      }
    }, 30000);
  }

  // Get current price for a symbol
  getPrice(symbol) {
    const feed = this.priceFeeds.get(symbol);
    if (!feed) {
      console.log(`No price feed found for symbol: ${symbol}`);
      return null;
    }
  
    try {
      // Use the exponent from the feed (with default fallback)
      const exponent = feed.exponent !== undefined ? feed.exponent : -8;
      const actualPrice = Number(feed.price) * Math.pow(10, exponent);
      
      // Calculate confidence with proper fallback
      let confidenceInterval;
      if (feed.confidence !== undefined && feed.confidence !== null) {
        confidenceInterval = Number(feed.confidence) * Math.pow(10, exponent);
      } else {
        // Default confidence: 0.1% of the price
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
  
      console.log(`getPrice(${symbol}):`, priceData);
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

  // Get price change
  getPriceChange(symbol, period = '24h') {
    const priceData = this.getPrice(symbol);
    if (!priceData) return null;

    // For mock data, generate realistic changes
    if (priceData.isMock) {
      const change = (Math.random() * 10 - 5).toFixed(2);
      const trend = Math.abs(change) < 0.5 ? 'flat' : change > 0 ? 'up' : 'down';
      
      return { 
        change: parseFloat(change), 
        trend 
      };
    }

    // Mock changes for real data (in production, calculate from historical)
    const mockChanges = {
      BTC: { change: 2.5, trend: 'up' },
      ETH: { change: -1.2, trend: 'down' },
      SOL: { change: 5.7, trend: 'up' },
      BNB: { change: 0.8, trend: 'up' },
      USDC: { change: 0.1, trend: 'flat' },
      DAI: { change: -0.2, trend: 'down' },
    };

    return mockChanges[symbol] || { change: 0, trend: 'flat' };
  }
}

// Create and export singleton instance
export const pythService = new PythService();