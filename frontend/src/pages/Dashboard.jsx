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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-duneGold to-duneClay p-6 text-duneDark">
      <div className="max-w-6xl mx-auto space-y-8">
        <WalletConnect onConnect={setWallet} />

        <h1 className="text-3xl font-bold text-center mb-6 drop-shadow">
          EventSense Prediction Dashboard
        </h1>

        {markets.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        
        ) : (
          <p className="text-center text-duneBrown">
            No market data available.
          </p>
        )}

        <AIAssistant />
      </div>
    </div>
  );
}
