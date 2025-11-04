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
    <div className="mt-10 bg-duneRose/30 backdrop-blur-md rounded-2xl shadow-md p-6 border border-duneClay">
      <h3 className="text-xl font-semibold mb-3 text-duneDark drop-shadow-sm">
        Ask EventSense AI
      </h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about a prediction trend..."
          className="flex-1 p-3 border-2 border-duneClay bg-white/70 text-duneDark rounded-lg focus:ring-2 focus:ring-duneGold focus:outline-none placeholder:text-duneClay/70"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`px-5 py-2.5 rounded-lg font-semibold transition ${
            loading
              ? "bg-duneClay text-white cursor-not-allowed"
              : "bg-duneGold hover:bg-duneBrown text-duneDark"
          }`}
        >
          {loading ? "Analyzing..." : "Ask"}
        </button>
      </div>

      {response && (
        <div className="bg-white/80 p-4 rounded-lg text-duneDark border border-duneClay shadow-sm">
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
}