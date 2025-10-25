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
      alert("Please install MetaMask or a BNB-compatible wallet.");
    }
  };

  // Notify parent component when connection state changes
  React.useEffect(() => {
    if (onConnect) {
      onConnect(isConnected ? { address } : null);
    }
  }, [isConnected, address, onConnect]);

  return (
    <div className="flex justify-end items-center gap-3 p-4 bg-white rounded-xl shadow-md">
      {isConnected && address ? (
        <div className="flex items-center gap-3">
          <span className="text-gray-700 text-sm font-mono">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="bg-red-400 hover:bg-red-300 text-white px-3 py-1 rounded-lg font-semibold text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg font-semibold"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}