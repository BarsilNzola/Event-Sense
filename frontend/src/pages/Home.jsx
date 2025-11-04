import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-softIvory text-duneDark text-center px-6">
      <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
        EventSense: DeAI for Markets
      </h1>

      <p className="text-lg mb-8 max-w-xl text-gray-700">
        Explore AI-powered insights on decentralized prediction markets —
        summarized, verified, and stored on-chain.
      </p>

      <Link
        to="/dashboard"
        className="px-6 py-3 bg-tropicalTeal text-white rounded-xl font-semibold hover:bg-darkTeal transition shadow-md"
      >
        View Insights
      </Link>
    </div>
  );
}