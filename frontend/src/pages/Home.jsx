import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#EFE9E0] text-[#4A2B1C] px-6">
      {/* Logo Section */}
      <div className="mb-12 flex flex-col items-center">
        <img 
          src="/logo.png"
          alt="EventSense Logo"
          className="w-32 h-32 mb-6 object-contain"
        />
        <h1 className="text-5xl md:text-6xl font-bold text-[#0F9E99] text-center leading-tight">
          EventSense
        </h1>
        <p className="text-xl text-[#98521F] mt-3">
          DeAI for Markets
        </p>
      </div>

      {/* Main Content */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xl md:text-2xl mb-12 text-[#98521F] leading-relaxed">
          Explore AI-powered insights on decentralized prediction markets — 
          summarized, verified, and stored on-chain.
        </p>

        <Link
          to="/dashboard"
          className="inline-block bg-[#0F9E99] hover:bg-[#0C7F7A] text-white font-semibold py-4 px-16 rounded-xl shadow-lg transition-all duration-300 text-lg transform hover:scale-105 hover:shadow-xl"
        >
          View Insights
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mt-20">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-[#0F9E99] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg"></span>
          </div>
          <h3 className="font-semibold text-[#0F9E99] mb-2">AI Analysis</h3>
          <p className="text-[#98521F] text-sm">Advanced AI processes market data</p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-[#0F9E99] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg"></span>
          </div>
          <h3 className="font-semibold text-[#0F9E99] mb-2">On-Chain Storage</h3>
          <p className="text-[#98521F] text-sm">Insights permanently verified</p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-[#0F9E99] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg"></span>
          </div>
          <h3 className="font-semibold text-[#0F9E99] mb-2">Live Markets</h3>
          <p className="text-[#98521F] text-sm">Real-time prediction data</p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-16 text-sm text-[#6B7280]">
        <p>Powered by decentralized AI and blockchain technology</p>
      </div>
    </div>
  );
}