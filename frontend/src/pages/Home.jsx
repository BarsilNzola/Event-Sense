import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-indigo-900 to-purple-700 text-white">
      <h1 className="text-5xl font-bold mb-4">EventSense: DeAI for Markets</h1>
      <p className="text-lg mb-8 text-center max-w-xl">
        Explore AI-powered insights on decentralized prediction markets — summarized, verified, and stored on-chain.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-3 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition"
      >
        View Insights
      </Link>
    </div>
  );
}
