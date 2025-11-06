import { useEffect, useState } from "react";
import { getPredictionSummary } from "../services/api";
import WalletConnect from "../components/WalletConnect";
import MarketCard from "../components/MarketCard";
import PriceFeed from "../components/PriceFeed";
import AIAssistant from "../components/AIAssistant";
import NewsFeed from "../components/NewsFeed";

export default function Dashboard() {
  const [markets, setMarkets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoInsights, setAutoInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketData, insightsData] = await Promise.all([
          getPredictionSummary(),
          fetchAutoInsights()
        ]);
        setMarkets(marketData.markets || []);
        setAutoInsights(insightsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
        setInsightsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchAutoInsights = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/ai/insights/auto");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching auto insights:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#EFE9E0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #0F9E99',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#4A2B1C', fontSize: '18px' }}>Loading market data...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#EFE9E0', 
      color: '#4A2B1C',
      padding: '32px 16px'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto 40px' 
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#0F9E99',
              marginBottom: '8px'
            }}>
              EventSense Dashboard
            </h1>
            <p style={{ color: '#98521F', fontSize: '1.125rem' }}>
              AI-powered market insights
            </p>
          </div>
          <WalletConnect onConnect={setWallet} />
        </div>

        {/* Wallet address display */}
        {wallet?.address && (
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #E0F2F1',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <span style={{ color: '#98521F' }}>Connected: </span>
            <span style={{ 
              fontFamily: 'monospace',
              color: '#0F9E99',
              fontWeight: '600'
            }}>
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </span>
          </div>
        )}
      </div>

      {/* Price Feed */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 40px' }}>
        <PriceFeed />
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        
        {/* Left Column - Markets & News */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Market Data Section */}
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#0F9E99',
              marginBottom: '24px'
            }}>
              Live Market Insights
            </h2>

            {markets.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px'
              }}>
                {markets.map((m) => (
                  <MarketCard key={m.id} market={m} />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#98521F',
                backgroundColor: 'white',
                border: '1px solid #0F9E99',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '8px' }}>
                  No market data available.
                </p>
                <p style={{ fontSize: '0.875rem' }}>Try refreshing the page.</p>
              </div>
            )}
          </div>

          {/* News Feed Section */}
          <div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#0F9E99',
              marginBottom: '24px'
            }}>
              Market News
            </h2>
            <NewsFeed />
          </div>
        </div>

        {/* Right Column - AI Insights & Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Auto Insights Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E0F2F1'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#0F9E99',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              AI Market Analysis
            </h3>

            {insightsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #0F9E99',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px'
                }}></div>
                <p style={{ color: '#98521F', fontSize: '0.875rem' }}>
                  Generating insights...
                </p>
              </div>
            ) : autoInsights?.analysis ? (
              <div>
                <div style={{
                  backgroundColor: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px'
                }}>
                  <p style={{
                    color: '#4A2B1C',
                    lineHeight: '1.6',
                    fontSize: '0.95rem',
                    whiteSpace: 'pre-line'
                  }}>
                    {autoInsights.analysis}
                  </p>
                </div>
                
                {autoInsights.dataSources && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    fontSize: '0.75rem',
                    color: '#98521F'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#0F9E99' }}>
                        {autoInsights.dataSources.cryptoPrices}
                      </div>
                      <div>Crypto Prices</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#0F9E99' }}>
                        {autoInsights.dataSources.predictionMarkets}
                      </div>
                      <div>Markets</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#0F9E99' }}>
                        {autoInsights.dataSources.newsArticles}
                      </div>
                      <div>News</div>
                    </div>
                  </div>
                )}
                
                {autoInsights.timestamp && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6B7280',
                    textAlign: 'center',
                    marginTop: '12px',
                    borderTop: '1px solid #E5E7EB',
                    paddingTop: '12px'
                  }}>
                    Updated: {new Date(autoInsights.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#98521F',
                padding: '20px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px dashed #E2E8F0'
              }}>
                <p style={{ fontSize: '0.875rem' }}>
                  Insights will be available shortly. The AI is analyzing market data.
                </p>
              </div>
            )}
          </div>

          {/* AI Assistant Section */}
          <div>
            <AIAssistant markets={markets} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}