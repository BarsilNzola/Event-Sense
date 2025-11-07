import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, bsc, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

// Get WalletConnect Project ID from environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// Configure Wagmi with multiple connectors
const config = createConfig({
  chains: [mainnet, bsc, sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true, // This enables the WalletConnect modal
    }),
    coinbaseWallet({
      appName: "EventSense",
      preference: "smartWalletOnly", // or 'all'
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;