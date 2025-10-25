import { useEffect, useState } from "react";
import { getPredictionSummary } from "../services/api";
import WalletConnect from "../components/WalletConnect";
import MarketCard from "../components/MarketCard";
import AIAssistant from "../components/AIAssistant";

export default function Dashboard() {
  const [markets, setMarkets] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const result = await getPredictionSummary();
        // Example mock shaping
        const mockData = [
          {
            question: "Will BTC exceed $70k by Dec?",
            trend: "up",
            change: 8.2,
            aiSummary: result.summary,
            history: [
              { date: "Oct 1", probability: 0.52 },
              { date: "Oct 5", probability: 0.60 },
              { date: "Oct 10", probability: 0.68 },
            ],
            cid: result.cid,
          },
        ];
        setMarkets(mockData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMarkets();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <WalletConnect onConnect={setWallet} />

      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 drop-shadow">
        EventSense Prediction Dashboard
      </h1>

      {markets.map((m, i) => (
        <MarketCard key={i} market={m} />
      ))}

      <AIAssistant />
    </div>
  );
}
