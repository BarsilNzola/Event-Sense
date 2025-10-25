import { useEffect, useState } from "react";
import { getLiveMarkets } from "../services/api";
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
        const data = await getLiveMarkets();
        setMarkets(data);
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
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <WalletConnect onConnect={setWallet} />

      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 drop-shadow">
        EventSense Prediction Dashboard
      </h1>

      {markets.length > 0 ? (
        markets.map((m) => <MarketCard key={m.id} market={m} />)
      ) : (
        <p className="text-center text-gray-500">No market data available.</p>
      )}

      <AIAssistant />
    </div>
  );
}
