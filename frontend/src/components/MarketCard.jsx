import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";

export default function MarketCard({ market }) {
  // Handle flat trend with a minus icon
  const trendColor = market.trend === "up" ? "#10B981" : market.trend === "down" ? "#EF4444" : "#6B7280";
  const probabilityPercent = (market.probability * 100).toFixed(1);
  
  // Format volume/liquidity with better fallbacks
  const formatVolume = (volume) => {
    if (!volume && volume !== 0) return "$0";
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (market.trend) {
      case "up": return <FaArrowUp />;
      case "down": return <FaArrowDown />;
      default: return <FaMinus />;
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #E0F2F1',
      transition: 'all 0.3s ease',
      height: 'fit-content',
      minHeight: '320px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: '#4A2B1C',
          lineHeight: '1.4',
          flex: 1,
          marginRight: '16px'
        }}>
          {market.question}
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: trendColor,
          fontWeight: '600',
          fontSize: '0.875rem'
        }}>
          {getTrendIcon()}
          {market.change}%
        </div>
      </div>

      {/* Probability Display */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#98521F', fontSize: '0.875rem' }}>Probability</span>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#0F9E99'
          }}>
            {probabilityPercent}%
          </span>
        </div>
        <div style={{
          width: '100%',
          backgroundColor: '#E5E7EB',
          borderRadius: '9999px',
          height: '8px'
        }}>
          <div 
            style={{
              backgroundColor: '#0F9E99',
              height: '8px',
              borderRadius: '9999px',
              transition: 'width 0.5s ease',
              width: `${probabilityPercent}%`
            }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: '#E0F2F1',
          borderRadius: '8px'
        }}>
          <div style={{
            color: '#98521F',
            fontSize: '0.75rem',
            fontWeight: '500',
            marginBottom: '4px'
          }}>
            Volume
          </div>
          <div style={{
            fontWeight: '600',
            color: '#4A2B1C',
            fontSize: '0.875rem'
          }}>
            {formatVolume(market.volume)}
          </div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: '#E0F2F1',
          borderRadius: '8px'
        }}>
          <div style={{
            color: '#98521F',
            fontSize: '0.75rem',
            fontWeight: '500',
            marginBottom: '4px'
          }}>
            Liquidity
          </div>
          <div style={{
            fontWeight: '600',
            color: '#4A2B1C',
            fontSize: '0.875rem'
          }}>
            {formatVolume(market.liquidity)}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: '#98521F',
        marginBottom: '8px'
      }}>
        <span>24h Change</span>
        <span style={{ 
          fontWeight: '600',
          color: trendColor
        }}>
          {market.change}%
        </span>
      </div>

      {/* Last Updated */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#6B7280',
        marginBottom: '16px'
      }}>
        <span>Updated</span>
        <span>
          {market.updated ? new Date(market.updated).toLocaleTimeString() : 'Recently'}
        </span>
      </div>

      {/* Category */}
      {market.category && market.category !== 'General' && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <span style={{
            display: 'inline-block',
            backgroundColor: '#0F9E99',
            color: 'white',
            fontSize: '0.75rem',
            padding: '4px 12px',
            borderRadius: '9999px'
          }}>
            {market.category}
          </span>
        </div>
      )}

      {/* IPFS Link */}
      {market.cid && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
          textAlign: 'center'
        }}>
          <a
            href={`https://gateway.lighthouse.storage/ipfs/${market.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#0F9E99',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            View on IPFS ↗
          </a>
        </div>
      )}
    </div>
  );
}