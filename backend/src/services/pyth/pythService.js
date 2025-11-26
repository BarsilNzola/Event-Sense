import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";
import { uploadToLighthouse } from "../lighthouse/lighthouseService.js";

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
    this.dailySnapshot = new Map(); // Stores Asian session opening prices
    this.isConnected = false;
    this.useMock = false;
    this.initializationPromise = null;
    this.lastSnapshotDate = null;
    this.asianSessionHour = 0; // 00:00 UTC (8:00 AM Singapore/Hong Kong time)
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      // Load previous daily snapshot from Lighthouse
      await this.loadDailySnapshot();
      
      // Check if we need to take a new snapshot for today
      await this.checkAndUpdateSnapshot();
      
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
          });
        }

        this.isConnected = true;
        console.log('Pyth Network connected successfully');
        console.log(`Daily snapshot loaded for ${this.dailySnapshot.size} symbols`);
        
        this.startPriceUpdates();
        this.startSnapshotScheduler();
        
      } catch (error) {
        console.error('Pyth Network initialization failed:', error);
        console.log('Falling back to mock price data');
        this.useMock = true;
        this.initializeMockData();
      }
    })();

    return this.initializationPromise;
  }

  // Load daily snapshot from Lighthouse storage
  async loadDailySnapshot() {
    try {
      // Try to fetch the latest daily snapshot from Lighthouse
      // We'll use a fixed CID or track the latest snapshot CID
      const snapshotCid = await this.getLatestSnapshotCid();
      if (snapshotCid) {
        const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${snapshotCid}`);
        if (response.ok) {
          const snapshot = await response.json();
          this.dailySnapshot = new Map(Object.entries(snapshot.prices));
          this.lastSnapshotDate = snapshot.date;
          console.log(`Loaded daily snapshot from ${snapshot.date} with ${this.dailySnapshot.size} symbols`);
          return;
        }
      }
      
      // If no snapshot exists, initialize empty
      console.log('No existing daily snapshot found');
      this.dailySnapshot = new Map();
      
    } catch (error) {
      console.error('Failed to load daily snapshot:', error);
      this.dailySnapshot = new Map();
    }
  }

  // Get the latest snapshot CID (you might want to store this in a config or database)
  async getLatestSnapshotCid() {
    // In a real implementation, you'd store and retrieve this from a persistent location
    // For now, we'll return null to trigger new snapshot creation
    return null;
  }

  // Check if we need to take a new daily snapshot
  async checkAndUpdateSnapshot() {
    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    const today = now.toISOString().split('T')[0];
    
    // Check if it's Asian session time (00:00 UTC) and we haven't taken today's snapshot
    if (currentHourUTC === this.asianSessionHour && this.lastSnapshotDate !== today) {
      console.log('Asian market session started - taking daily snapshot');
      await this.takeDailySnapshot();
    }
  }

  // Take daily snapshot at Asian market open
  async takeDailySnapshot() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const snapshotPrices = {};
      
      // Capture current prices for all symbols
      for (const [symbol] of Object.entries(PYTH_PRICE_IDS)) {
        const priceData = this.getPrice(symbol);
        if (priceData) {
          snapshotPrices[symbol] = {
            price: priceData.price,
            timestamp: new Date().toISOString()
          };
          this.dailySnapshot.set(symbol, priceData.price);
        }
      }

      const snapshot = {
        type: 'daily_asian_session_snapshot',
        date: today,
        session: 'asian',
        timestamp: new Date().toISOString(),
        prices: snapshotPrices
      };

      // Store to Lighthouse
      const cid = await uploadToLighthouse(snapshot);
      if (cid) {
        this.lastSnapshotDate = today;
        console.log(`Daily Asian session snapshot saved: ${cid}`);
        
        // Store the CID for future retrieval (you might want to save this to a database)
        this.lastSnapshotCid = cid;
      }
      
    } catch (error) {
      console.error('Failed to take daily snapshot:', error);
    }
  }

  // Schedule daily snapshot at Asian market open
  startSnapshotScheduler() {
    // Calculate milliseconds until next Asian session (00:00 UTC)
    const now = new Date();
    const nextSnapshot = new Date(now);
    nextSnapshot.setUTCHours(this.asianSessionHour, 0, 0, 0);
    
    if (nextSnapshot <= now) {
      nextSnapshot.setDate(nextSnapshot.getDate() + 1);
    }
    
    const delay = nextSnapshot.getTime() - now.getTime();
    
    console.log(`Next daily snapshot scheduled for: ${nextSnapshot.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
    
    setTimeout(() => {
      this.takeDailySnapshot();
      // Schedule subsequent snapshots every 24 hours
      setInterval(() => {
        this.takeDailySnapshot();
      }, 24 * 60 * 60 * 1000);
    }, delay);
  }

  // Calculate 24h change based on Asian session opening price
  calculate24hChange(currentPrice, symbol) {
    const sessionOpenPrice = this.dailySnapshot.get(symbol);
    
    if (!sessionOpenPrice || sessionOpenPrice === 0) {
      console.log(`No daily snapshot price for ${symbol}, using current price as baseline`);
      return 0;
    }
    
    const change = ((currentPrice - sessionOpenPrice) / sessionOpenPrice) * 100;
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
          
          this.priceFeeds.set(symbol, {
            price: price.price,
            confidence: price.confidence || price.price * 0.001,
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

  // Get 24h price change based on Asian session opening
  getPriceChange(symbol) {
    const priceData = this.getPrice(symbol);
    if (!priceData) {
      return { change: 0, trend: 'flat' };
    }

    const change = this.calculate24hChange(priceData.price, symbol);
    const trend = this.getPriceTrend(change);
    
    console.log(`24h price change for ${symbol} (Asian session):`, {
      currentPrice: priceData.price,
      sessionOpenPrice: this.dailySnapshot.get(symbol),
      change,
      trend
    });
    
    return { 
      change: change, 
      trend: trend,
      period: '24h',
      baseline: 'asian_session_open'
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

  // Mock data methods
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

      // Initialize mock daily snapshot
      this.dailySnapshot.set(symbol, mockPrices[symbol]);
    });

    this.isConnected = true;
    this.lastSnapshotDate = new Date().toISOString().split('T')[0];
    console.log('Mock price data initialized with daily snapshot');
  }
}

export const pythService = new PythService();