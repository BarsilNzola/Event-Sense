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

  return (
    <div className="flex justify-end items-center">
      {isConnected && address ? (
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-4 py-2 border border-lightTeal">
          <span className="text-gray-700 text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold text-sm transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="bg-tropicalTeal hover:bg-darkTeal text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}