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
      const { data } = await axios.post("http://localhost:5000/api/ai/query", { question: query });
      setResponse(data.answer);
    } catch (err) {
      console.error(err);
      setResponse("Error fetching AI response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Ask EventSense AI</h3>
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about a prediction trend..."
          className="flex-1 p-2 border rounded-lg text-gray-700"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg font-semibold"
        >
          {loading ? "Analyzing..." : "Ask"}
        </button>
      </div>
      {response && (
        <div className="bg-gray-50 p-3 rounded-md text-gray-700 border border-gray-200">
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
}
