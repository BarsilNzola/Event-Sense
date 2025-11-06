import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#EFE9E0] text-[#4A2B1C] text-center px-6">
      <h1 className="text-5xl font-bold mb-4">
        EventSense: DeAI for Markets
      </h1>

      <p className="text-lg mb-8 max-w-xl text-[#98521F]">
        Explore AI-powered insights on decentralized prediction markets —
        summarized, verified, and stored on-chain.
      </p>

      <Link
        to="/dashboard"
        className="bg-[#0F9E99] hover:bg-[#0C7F7A] text-white font-semibold py-3 px-8 rounded-xl shadow-md transition duration-300"
      >
        View Insights
      </Link>
    </div>
  );
}