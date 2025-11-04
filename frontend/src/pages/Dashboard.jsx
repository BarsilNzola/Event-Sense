import { useEffect, useState } from "react";
import { getPredictionSummary } from "../services/api";
import WalletConnect from "../components/WalletConnect";
import MarketCard from "../components/MarketCard";
import AIAssistant from "../components/AIAssistant";
import Loader from "../components/Loader";

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

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-softIvory text-duneDark py-10 px-6">
      {/* Header with Wallet Connection */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-tropicalTeal">
            EventSense Dashboard
          </h1>
          <p className="text-gray-600 mt-2">AI-powered market insights</p>
        </div>
        <WalletConnect onConnect={setWallet} />
      </div>

      {/* Market Data Section */}
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold text-tropicalTeal mb-4">
          🔮 Live Market Insights
        </h2>

        {markets.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-white border border-tropicalTeal p-8 rounded-2xl shadow-sm">
            <p className="text-lg">No market data available.</p>
            <p className="text-sm mt-2">Try refreshing the page.</p>
          </div>
        )}
      </div>

      {/* AI Assistant Section */}
      <div className="max-w-4xl mx-auto mt-12">
        <AIAssistant markets={markets} />
      </div>
    </div>
  );
}