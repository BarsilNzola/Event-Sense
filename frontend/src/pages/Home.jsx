import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#EFE9E0',
      color: '#4A2B1C',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      textAlign: 'center'
    }}>
      {/* Logo Section */}
      <div style={{
        marginBottom: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <img 
          src="/logo.png"
          alt="EventSense Logo"
          style={{
            width: '80px',
            height: '80px',
            marginBottom: '24px',
            objectFit: 'contain'
          }}
        />
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          color: '#0F9E99',
          margin: '0 0 8px 0',
          lineHeight: '1.1'
        }}>
          EventSense
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#98521F',
          margin: '0'
        }}>
          DeAI for Markets
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 48px'
      }}>
        <p style={{
          fontSize: '1.25rem',
          color: '#98521F',
          marginBottom: '48px',
          lineHeight: '1.6'
        }}>
          Explore AI-powered insights on decentralized prediction markets — 
          summarized, verified, and stored on-chain.
        </p>

        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            backgroundColor: '#0F9E99',
            color: 'white',
            fontWeight: '600',
            padding: '16px 64px',
            borderRadius: '12px',
            fontSize: '1.125rem',
            textDecoration: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#0C7F7A';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#0F9E99';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
        >
          View Insights
        </Link>
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: '64px',
        fontSize: '0.875rem',
        color: '#6B7280'
      }}>
        <p>Powered by decentralized AI and blockchain technology</p>
      </div>
    </div>
  );
}