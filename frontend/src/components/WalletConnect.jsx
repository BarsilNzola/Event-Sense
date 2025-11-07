import React, { useEffect, useState } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";

export default function WalletConnect({ onConnect }) {
  const { connect, connectors, error } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [detectedWallets, setDetectedWallets] = useState([]);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Detect installed wallets
  useEffect(() => {
    const wallets = [];
    
    // Check for MetaMask
    if (window.ethereum?.isMetaMask) {
      wallets.push({
        id: "metaMask",
        name: "MetaMask",
        icon: "🦊",
        connector: new MetaMaskConnector()
      });
    }
    
    // Check for Coinbase Wallet
    if (window.ethereum?.isCoinbaseWallet) {
      wallets.push({
        id: "coinbaseWallet",
        name: "Coinbase Wallet",
        icon: "⚡",
        connector: new CoinbaseWalletConnector({
          options: {
            appName: "EventSense",
          }
        })
      });
    }
    
    // Check for other injected wallets (Trust Wallet, Rainbow, etc.)
    if (window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
      wallets.push({
        id: "injected",
        name: "Browser Wallet",
        icon: "🌐",
        connector: new MetaMaskConnector() // Use MetaMask connector for generic injected
      });
    }
    
    // Always include WalletConnect as an option
    wallets.push({
      id: "walletConnect",
      name: "WalletConnect",
      icon: "🔗",
      connector: new WalletConnectConnector({
        options: {
          projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID, // Make sure this is set
          showQrModal: true,
        }
      })
    });
    
    setDetectedWallets(wallets);
  }, []);

  const handleWalletConnect = (connector) => {
    connect({ connector });
    setShowWalletOptions(false);
  };

  const handleConnect = () => {
    if (detectedWallets.length === 1) {
      // If only one wallet detected, connect directly
      handleWalletConnect(detectedWallets[0].connector);
    } else {
      // Show wallet options
      setShowWalletOptions(true);
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
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    minWidth: '160px'
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

  const walletOptionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    margin: '8px 0',
    backgroundColor: 'white',
    border: '2px solid #E0F2F1',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textAlign: 'left'
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  };

  return (
    <div>
      {isConnected && address ? (
        <div style={connectedStyle}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981'
            }}></div>
            <span style={{ 
              color: '#4A2B1C',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
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
        <>
          <button
            onClick={handleConnect}
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0C7F7A'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#0F9E99'}
          >
            Connect Wallet
          </button>

          {showWalletOptions && (
            <div style={modalStyle} onClick={() => setShowWalletOptions(false)}>
              <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: '#0F9E99',
                    fontSize: '1.25rem'
                  }}>
                    Connect Wallet
                  </h3>
                  <button
                    onClick={() => setShowWalletOptions(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6B7280'
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '0.875rem',
                    margin: '0 0 12px 0'
                  }}>
                    Choose your wallet:
                  </p>
                  
                  {detectedWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleWalletConnect(wallet.connector)}
                      style={walletOptionStyle}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = '#0F9E99';
                        e.target.style.backgroundColor = '#F0FDF4';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = '#E0F2F1';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{wallet.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#4A2B1C',
                          fontSize: '1rem'
                        }}>
                          {wallet.name}
                        </div>
                        {wallet.id === 'injected' && (
                          <div style={{
                            color: '#6B7280',
                            fontSize: '0.75rem'
                          }}>
                            Detected in your browser
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '0.875rem',
                    marginTop: '12px'
                  }}>
                    {error.message}
                  </div>
                )}

                <div style={{
                  padding: '12px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '8px',
                  border: '1px solid #BBF7D0',
                  marginTop: '16px'
                }}>
                  <div style={{
                    color: '#166534',
                    fontSize: '0.75rem',
                    textAlign: 'center'
                  }}>
                    🔒 Your wallet connection is secure and private
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}