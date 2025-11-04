import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import MarketChart from "./MarketChart";

export default function MarketCard({ market }) {
  const trendColor = market.trend === "up" ? "text-green-600" : "text-red-600";

  return (
    <div className="bg-white rounded-2xl shadow-md border border-lightTeal p-6 hover:shadow-lg transition duration-300">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold text-duneDark leading-snug flex-1 mr-4">
          {market.question}
        </h2>

        <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
          {market.trend === "up" ? <FaArrowUp /> : <FaArrowDown />}
          {market.change}%
        </div>
      </div>

      {/* Probability Display */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Probability</span>
          <span className="text-xl font-bold text-tropicalTeal">
            {(market.probability * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-tropicalTeal h-2 rounded-full transition-all duration-500"
            style={{ width: `${market.probability * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Chart */}
      {market.history && (
        <div className="mt-4 mb-4">
          <MarketChart data={market.history} />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="text-center p-3 bg-lightTeal rounded-lg">
          <div className="text-gray-600 text-xs">Volume</div>
          <div className="font-semibold text-duneDark">
            ${market.volume?.toLocaleString() || "0"}
          </div>
        </div>
        <div className="text-center p-3 bg-lightTeal rounded-lg">
          <div className="text-gray-600 text-xs">Liquidity</div>
          <div className="font-semibold text-duneDark">
            ${market.liquidity?.toLocaleString() || "0"}
          </div>
        </div>
      </div>

      {/* Category */}
      {market.category && (
        <div className="mt-4 text-center">
          <span className="inline-block bg-tropicalTeal text-white text-xs px-3 py-1 rounded-full">
            {market.category}
          </span>
        </div>
      )}

      {/* IPFS Link */}
      {market.cid && (
        <div className="text-xs text-gray-500 mt-4 border-t pt-3 text-center">
          <a
            href={`https://gateway.lighthouse.storage/ipfs/${market.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tropicalTeal hover:text-darkTeal hover:underline"
          >
            View on IPFS ↗
          </a>
        </div>
      )}
    </div>
  );
}