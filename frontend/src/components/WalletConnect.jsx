import React, { useEffect } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";

export default function WalletConnect({ onConnect }) {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      alert("Please install MetaMask or a compatible wallet.");
    }
  };

  useEffect(() => {
    if (onConnect) {
      onConnect(isConnected ? { address } : null);
    }
  }, [isConnected, address, onConnect]);

  const buttonStyle = {
    backgroundColor: '#0F9E99',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const disconnectButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#EF4444',
    padding: '8px 16px',
    fontSize: '0.875rem'
  };

  const connectedStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'white',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #E0F2F1',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div>
      {isConnected && address ? (
        <div style={connectedStyle}>
          <span style={{ 
            color: '#4A2B1C',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            style={disconnectButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = '#DC2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          style={buttonStyle}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0C7F7A'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#0F9E99'}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}