import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import MarketChart from "./MarketChart";

export default function MarketCard({ market }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{market.question}</h2>
        <span
          className={`flex items-center text-sm font-semibold ${
            market.trend === "up" ? "text-green-500" : "text-red-500"
          }`}
        >
          {market.trend === "up" ? <FaArrowUp /> : <FaArrowDown />} {market.change}%
        </span>
      </div>

      <p className="text-gray-600 mt-3">{market.aiSummary}</p>

      <MarketChart data={market.history} />

      <div className="text-sm text-gray-500 mt-4">
        <strong>CID:</strong> {market.cid} |{" "}
        <a
          href={`https://gateway.lighthouse.storage/ipfs/${market.cid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          View on IPFS
        </a>
      </div>
    </div>
  );
}
