import { useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown, FaSync, FaExclamationTriangle } from "react-icons/fa";

export default function PriceFeed() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:5000/api/prices/feeds-with-changes");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Frontend - Received price data:', data); // Debug log
      
      if (data.success) {
        setPrices(data.data);
        setLastUpdated(new Date(data.timestamp));
      } else {
        throw new Error(data.error || 'Failed to fetch prices');
      }
    } catch (error) {
      console.error("❌ Failed to fetch prices:", error);
      setError(error.message);
      setPrices({}); // Clear prices on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    if (!price && price !== 0) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <FaArrowUp className="inline" />;
      case 'down': return <FaArrowDown className="inline" />;
      default: return <span className="inline">➡️</span>;
    }
  };

  // Error state
  if (error) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #FECACA'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#DC2626' }}>
          <FaExclamationTriangle />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            Price Feed Error
          </h3>
        </div>
        <p style={{ color: '#7F1D1D', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={fetchPrices}
          style={{
            backgroundColor: '#0F9E99',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading && Object.keys(prices).length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E0F2F1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #0F9E99',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0F9E99' }}>
            Loading Price Feeds...
          </h3>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // No data state
  if (Object.keys(prices).length === 0 && !loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E0F2F1'
      }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
            No Price Data Available
          </h3>
          <p>Check if the backend server is running and Pyth service is connected.</p>
          <button
            onClick={fetchPrices}
            style={{
              backgroundColor: '#0F9E99',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E0F2F1'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0F9E99' }}>
          📊 Live Crypto Prices
        </h3>
        <button
          onClick={fetchPrices}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#0F9E99',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#E0F2F1'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Price Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {Object.entries(prices).map(([symbol, data]) => (
          <div
            key={symbol}
            style={{
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', color: '#4A2B1C' }}>{symbol}</span>
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600',
                color: getTrendColor(data.trend)
              }}>
                {getTrendIcon(data.trend)} {data.change > 0 ? '+' : ''}{data.change}%
              </span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#4A2B1C' }}>
              {formatPrice(data.price)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#98521F', marginTop: '4px' }}>
              Confidence: ±{formatPrice(data.confidence)}
            </div>
            {data.isMock && (
              <div style={{ fontSize: '0.65rem', color: '#CA8A04', marginTop: '2px' }}>
                (Mock Data)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#98521F'
        }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
          <br />
          <span style={{ fontSize: '0.75rem' }}>
            Powered by Pyth Network
          </span>
        </div>
      )}
    </div>
  );
}