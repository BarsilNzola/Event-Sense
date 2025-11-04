import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-duneDark via-duneBrown to-duneGold text-duneRose text-center px-6">
      <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
        EventSense: DeAI for Markets
      </h1>

      <p className="text-lg mb-8 max-w-xl">
        Explore AI-powered insights on decentralized prediction markets —
        summarized, verified, and stored on-chain.
      </p>

      <Link
        to="/dashboard"
        className="px-6 py-3 bg-duneRose text-duneDark rounded-xl font-semibold hover:bg-duneClay transition shadow-md"
      >
        View Insights
      </Link>
    </div>
  );
}
