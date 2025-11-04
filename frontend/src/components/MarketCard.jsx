import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import MarketChart from "./MarketChart";

export default function MarketCard({ market }) {
  const trendColor =
    market.trend === "up" ? "text-green-500" : "text-red-500";

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition duration-300">
      {/* Header */}
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-gray-800 leading-snug">
          {market.question}
        </h2>

        <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
          {market.trend === "up" ? <FaArrowUp /> : <FaArrowDown />}
          {market.change}%
        </div>
      </div>

      {/* Summary */}
      {market.aiSummary && (
        <p className="text-gray-600 mt-3 text-sm leading-relaxed">
          {market.aiSummary}
        </p>
      )}

      {/* Chart */}
      <div className="mt-4">
        <MarketChart data={market.history} />
      </div>

      {/* Stats Row */}
      <div className="flex justify-between items-center mt-5 text-sm">
        <div>
          <span className="text-gray-500">Probability:</span>{" "}
          <span className="font-semibold text-gray-800">
            {(market.probability * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Volume:</span>{" "}
          <span className="font-semibold text-gray-800">
            ${market.volume?.toLocaleString() || "0"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Category:</span>{" "}
          <span className="font-semibold text-gray-800 capitalize">
            {market.category || "General"}
          </span>
        </div>
      </div>

      {/* IPFS Link */}
      <div className="text-xs text-gray-500 mt-4 border-t pt-3">
        <strong>CID:</strong> {market.cid ? (
          <a
            href={`https://gateway.lighthouse.storage/ipfs/${market.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-1"
          >
            View on IPFS
          </a>
        ) : (
          <span className="ml-1 text-gray-400">No CID available</span>
        )}
      </div>
    </div>
  );
}
