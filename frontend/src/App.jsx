import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, bsc, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

// Configure Wagmi
const config = createConfig({
  chains: [mainnet, bsc, sepolia],
  connectors: [injected()],
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