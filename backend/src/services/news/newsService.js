import axios from "axios";
import { XMLParser } from 'fast-xml-parser';

class NewsService {
  constructor() {
    this.cache = null;
    this.lastUpdated = null;
    this.isUpdating = false;
    this.updateInterval = 15 * 60 * 1000; // 15 minutes
    this.xmlParser = new XMLParser();
  }

  async getNews() {
    if (!this.cache || this.isCacheStale()) {
      await this.updateCache();
    }
    return this.cache;
  }

  isCacheStale() {
    if (!this.lastUpdated) return true;
    return Date.now() - this.lastUpdated > this.updateInterval;
  }

  async updateCache() {
    if (this.isUpdating) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.cache;
    }

    this.isUpdating = true;
    console.log('Fetching fresh news...');

    try {
      // Use the two working RSS feeds
      const [cryptoNews, businessNews] = await Promise.allSettled([
        this.fetchCoinDeskNews(),
        this.fetchBBCBusinessNews()
      ]);

      let allArticles = [];

      // Process crypto news
      if (cryptoNews.status === 'fulfilled') {
        allArticles = allArticles.concat(cryptoNews.value.map(article => ({
          ...article,
          category: 'crypto'
        })));
      }

      // Process business news
      if (businessNews.status === 'fulfilled') {
        allArticles = allArticles.concat(businessNews.value.map(article => ({
          ...article,
          category: 'general'
        })));
      }

      console.log(`Fetched ${allArticles.length} total articles`);

      // Remove duplicates and sort by date
      const uniqueArticles = this.removeDuplicates(allArticles)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 20);

      this.cache = {
        articles: uniqueArticles,
        summary: {
          total: uniqueArticles.length,
          crypto: uniqueArticles.filter(a => a.category === 'crypto').length,
          general: uniqueArticles.filter(a => a.category === 'general').length
        },
        timestamp: new Date().toISOString()
      };

      this.lastUpdated = Date.now();
      console.log('News cache updated successfully');

    } catch (error) {
      console.error('Failed to update news cache:', error);
      if (!this.cache) {
        this.cache = { 
          articles: [], 
          timestamp: new Date().toISOString()
        };
      }
    } finally {
      this.isUpdating = false;
    }

    return this.cache;
  }

  // CoinDesk Crypto News
  async fetchCoinDeskNews() {
    try {
      const response = await axios.get('https://www.coindesk.com/arc/outboundfeeds/rss/', {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const parsed = this.xmlParser.parse(response.data);
      const items = parsed?.rss?.channel?.item || [];
      
      console.log(`CoinDesk returned ${items.length} items`);

      const articles = items.slice(0, 10).map(item => {
        // Clean up the description - remove HTML tags and limit length
        let description = item.description || item.title || '';
        description = description.replace(/<[^>]*>/g, '').substring(0, 200);
        
        return {
          id: `coindesk-${item.link?.hashCode()}`,
          title: item.title || 'CoinDesk News',
          description: description,
          url: item.link || '#',
          source: 'CoinDesk',
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: 'crypto'
        };
      });

      console.log(`Processed ${articles.length} CoinDesk articles`);
      return articles;

    } catch (error) {
      console.error('CoinDesk RSS failed:', error.message);
      return [];
    }
  }

  // BBC Business News
  async fetchBBCBusinessNews() {
    try {
      const response = await axios.get('https://feeds.bbci.co.uk/news/business/rss.xml', {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const parsed = this.xmlParser.parse(response.data);
      const items = parsed?.rss?.channel?.item || [];
      
      console.log(`BBC returned ${items.length} items`);

      const articles = items.slice(0, 10).map(item => {
        // Clean up the description
        let description = item.description || item.title || '';
        description = description.replace(/<[^>]*>/g, '').substring(0, 200);
        
        return {
          id: `bbc-${item.link?.hashCode()}`,
          title: item.title || 'BBC Business News',
          description: description,
          url: item.link || '#',
          source: 'BBC Business',
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: 'general'
        };
      });

      console.log(`Processed ${articles.length} BBC articles`);
      return articles;

    } catch (error) {
      console.error('BBC Business RSS failed:', error.message);
      return [];
    }
  }

  // Remove duplicate articles
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (seen.has(key) || !key || key.length < 5) return false;
      seen.add(key);
      return true;
    });
  }

  // Start auto-refresh
  startAutoRefresh() {
    console.log('Starting news auto-refresh (every 15 minutes)');
    this.updateCache();
    setInterval(() => {
      if (!this.isUpdating) {
        this.updateCache();
      }
    }, this.updateInterval);
  }

  // Force refresh
  async forceRefresh() {
    return await this.updateCache();
  }

  getCacheStatus() {
    return {
      hasData: !!this.cache,
      lastUpdated: this.lastUpdated ? new Date(this.lastUpdated).toISOString() : null,
      isStale: this.isCacheStale(),
      isUpdating: this.isUpdating,
      articleCount: this.cache?.articles?.length || 0
    };
  }
}

// Add hash function for string hashing
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const newsService = new NewsService();