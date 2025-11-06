import { useState } from "react";
import axios from "axios";

export default function AIAssistant({ markets }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧠 Manual text-based AI query
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

  // 🧠 Automated market analysis using backend AI summarizer
  const handleAnalyze = async () => {
    if (!markets || markets.length === 0) {
      setResponse("No market data available to analyze.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/ai/query", { data: markets });
      setResponse(data.answer);
    } catch (err) {
      console.error(err);
      setResponse("Error analyzing market data.");
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const askButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#0F9E99',
    color: 'white'
  };

  const analyzeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#E59B48',
    color: '#4A2B1C'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9CA3AF',
    color: '#6B7280',
    cursor: 'not-allowed',
    opacity: 0.7
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #E0F2F1',
      marginTop: '40px'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#0F9E99',
        marginBottom: '16px'
      }}>
        🤖 Ask EventSense AI
      </h3>

      {/* Manual Query Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexDirection: 'column',
          sm: { flexDirection: 'row' }
        }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about prediction trends, market analysis, or insights..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #E0F2F1',
              backgroundColor: '#EFE9E0',
              color: '#4A2B1C',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0F9E99'}
            onBlur={(e) => e.target.style.borderColor = '#E0F2F1'}
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            style={loading ? disabledButtonStyle : askButtonStyle}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#0C7F7A')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#0F9E99')}
          >
            {loading ? "Analyzing..." : "Ask AI"}
          </button>
        </div>
      </div>

      {/* Automated Analysis Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px'
      }}>
        <button
          onClick={handleAnalyze}
          disabled={loading || !markets || markets.length === 0}
          style={loading || !markets || markets.length === 0 ? disabledButtonStyle : analyzeButtonStyle}
          onMouseOver={(e) => !loading && markets && markets.length > 0 && (e.target.style.backgroundColor = '#D4892A')}
          onMouseOut={(e) => !loading && markets && markets.length > 0 && (e.target.style.backgroundColor = '#E59B48')}
        >
          {loading ? "Analyzing Markets..." : "Analyze All Markets"}
        </button>
      </div>

      {/* Response Display */}
      {response && (
        <div style={{
          backgroundColor: '#E0F2F1',
          padding: '16px',
          borderRadius: '8px',
          color: '#4A2B1C',
          border: '1px solid #0F9E99',
          marginTop: '16px'
        }}>
          <strong style={{ color: '#0F9E99' }}>AI Assistant:</strong> 
          <span style={{ marginLeft: '8px' }}>{response}</span>
        </div>
      )}

      {/* Info Text */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#FEF3C7',
        borderRadius: '8px',
        border: '1px solid #F59E0B'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#92400E',
          fontSize: '0.875rem'
        }}>
          <span>💡</span>
          <span>
            <strong>Tip:</strong> Ask about specific markets or use "Analyze All Markets" for a comprehensive overview.
          </span>
        </div>
      </div>
    </div>
  );
}