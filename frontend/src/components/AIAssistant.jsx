import { useState } from "react";
import axios from "axios";

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/ai/query", {
        question: query,
      });
      setResponse(data.answer);
    } catch (err) {
      console.error(err);
      setResponse("⚠️ Error fetching AI response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-md p-6 border border-lightTeal">
      <h3 className="text-xl font-semibold mb-4 text-tropicalTeal">
        🤖 Ask EventSense AI
      </h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about prediction trends, market analysis, or insights..."
          className="flex-1 p-3 border-2 border-lightTeal bg-softIvory text-duneDark rounded-lg focus:ring-2 focus:ring-tropicalTeal focus:outline-none placeholder:text-gray-500"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`px-5 py-3 rounded-lg font-semibold transition ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-tropicalTeal hover:bg-darkTeal text-white"
          }`}
        >
          {loading ? "Analyzing..." : "Ask AI"}
        </button>
      </div>

      {response && (
        <div className="bg-lightTeal p-4 rounded-lg text-duneDark border border-tropicalTeal">
          <strong className="text-tropicalTeal">AI Assistant:</strong> 
          <span className="ml-2">{response}</span>
        </div>
      )}
    </div>
  );
}