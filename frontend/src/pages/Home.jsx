import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#EFE9E0] text-[#4A2B1C] text-center px-6">
      <h1 className="text-5xl font-bold mb-6 text-[#0F9E99]">
        EventSense: DeAI for Markets
      </h1>

      <p className="text-xl mb-10 max-w-xl text-[#98521F]">
        Explore AI-powered insights on decentralized prediction markets -
        summarized, verified, and stored on-chain.
      </p>

      <Link
        to="/dashboard"
        className="bg-[#0F9E99] hover:bg-[#0C7F7A] text-white font-semibold py-4 px-12 rounded-xl shadow-lg transition duration-300 text-lg"
      >
        View Insights
      </Link>
    </div>
  );
}