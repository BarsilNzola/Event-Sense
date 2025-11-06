import { useEffect, useState } from "react";
import { getPredictionSummary } from "../services/api";
import WalletConnect from "../components/WalletConnect";
import MarketCard from "../components/MarketCard";
import PriceFeed from "../components/PriceFeed";
import AIAssistant from "../components/AIAssistant";

export default function Dashboard() {
  const [markets, setMarkets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const data = await getPredictionSummary();
        setMarkets(data.markets || []);
      } catch (err) {
        console.error("❌ Error fetching prediction summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

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
        maxWidth: '1200px', 
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

      <div className="max-w-7xl mx-auto mb-10">
        <PriceFeed />
      </div>

      {/* Market Data Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '600',
          color: '#0F9E99',
          marginBottom: '24px'
        }}>
          🔮 Live Market Insights
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

      {/* AI Assistant Section */}
      <div style={{ maxWidth: '800px', margin: '60px auto 0' }}>
        <AIAssistant markets={markets} />
      </div>
    </div>
  );
}