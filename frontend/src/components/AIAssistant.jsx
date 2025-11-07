import { useState, useEffect } from "react";
import axios from "axios";

export default function AIAssistant({ markets }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" or "insights"

  // 🧠 Fetch auto-generated insights
  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/ai/insights/history");
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  // 🧠 Manual text-based AI query
  const handleAsk = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    const userMessage = { type: 'user', content: query };
    setConversation(prev => [...prev, userMessage]);
    
    try {
      const { data } = await axios.post("http://localhost:5000/api/ai/query", { question: query });
      const aiMessage = { type: 'ai', content: data.answer };
      setConversation(prev => [...prev, aiMessage]);
      setResponse(data.answer);
    } catch (err) {
      console.error(err);
      const errorMessage = { type: 'ai', content: "I'm having trouble connecting right now. Please try again shortly." };
      setConversation(prev => [...prev, errorMessage]);
      setResponse("Error fetching AI response.");
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  // 🧠 Quick action buttons for common queries
  const handleQuickQuestion = async (question) => {
    setQuery(question);
    // Small delay to show the question in input, then send
    setTimeout(() => {
      handleAsk();
    }, 100);
  };

  // Clear conversation
  const clearChat = () => {
    setConversation([]);
    setResponse("");
  };

  // Refresh insights
  const refreshInsights = () => {
    fetchInsights();
  };

  // Load insights on component mount and set up auto-refresh
  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const buttonStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const askButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#0F9E99',
    color: 'white',
    flex: 1
  };

  const quickActionStyle = {
    ...buttonStyle,
    backgroundColor: '#E0F2F1',
    color: '#0F9E99',
    border: '1px solid #0F9E99'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9CA3AF',
    color: '#6B7280',
    cursor: 'not-allowed',
    opacity: 0.7
  };

  const clearButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#98521F',
    border: '1px solid #98521F',
    fontSize: '0.8rem',
    padding: '6px 12px'
  };

  const tabButtonStyle = (isActive) => ({
    ...buttonStyle,
    backgroundColor: isActive ? '#0F9E99' : 'transparent',
    color: isActive ? 'white' : '#0F9E99',
    border: `1px solid #0F9E99`,
    flex: 1
  });

  const refreshButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#0F9E99',
    border: '1px solid #0F9E99',
    fontSize: '0.8rem',
    padding: '6px 12px'
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E0F2F1',
      height: '600px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#0F9E99',
          margin: 0
        }}>
          EventSense AI
        </h3>
        
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '200px' }}>
          <button
            onClick={() => setActiveTab("chat")}
            style={tabButtonStyle(activeTab === "chat")}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            style={tabButtonStyle(activeTab === "insights")}
          >
            Insights
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === "chat" && conversation.length > 0 && (
            <button
              onClick={clearChat}
              style={clearButtonStyle}
              onMouseOver={(e) => e.target.style.backgroundColor = '#FEF3C7'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Clear Chat
            </button>
          )}
          {activeTab === "insights" && (
            <button
              onClick={refreshInsights}
              disabled={insightsLoading}
              style={refreshButtonStyle}
              onMouseOver={(e) => !insightsLoading && (e.target.style.backgroundColor = '#E0F2F1')}
              onMouseOut={(e) => !insightsLoading && (e.target.style.backgroundColor = 'transparent')}
            >
              {insightsLoading ? "..." : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "chat" ? (
        <>
          {/* Quick Actions */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{
              color: '#98521F',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '12px'
            }}>
              Quick Questions:
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                onClick={() => handleQuickQuestion("What are the most promising prediction markets right now?")}
                disabled={loading}
                style={quickActionStyle}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#0F9E99', e.target.style.color = 'white')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#E0F2F1', e.target.style.color = '#0F9E99')}
              >
                Most promising markets
              </button>
              <button
                onClick={() => handleQuickQuestion("What crypto events should I watch for prediction opportunities?")}
                disabled={loading}
                style={quickActionStyle}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#0F9E99', e.target.style.color = 'white')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#E0F2F1', e.target.style.color = '#0F9E99')}
              >
                Crypto event opportunities
              </button>
              <button
                onClick={() => handleQuickQuestion("How do prediction market probabilities work?")}
                disabled={loading}
                style={quickActionStyle}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#0F9E99', e.target.style.color = 'white')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#E0F2F1', e.target.style.color = '#0F9E99')}
              >
                How probabilities work
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            {conversation.length > 0 ? (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: msg.type === 'user' ? '#E0F2F1' : 'white',
                    border: msg.type === 'user' ? '1px solid #0F9E99' : '1px solid #E5E7EB'
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    color: msg.type === 'user' ? '#0F9E99' : '#E59B48',
                    fontSize: '0.8rem',
                    marginBottom: '4px'
                  }}>
                    {msg.type === 'user' ? 'You' : 'EventSense AI'}
                  </div>
                  <div style={{
                    color: '#4A2B1C',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#6B7280',
                fontStyle: 'italic',
                padding: '20px'
              }}>
                Start a conversation with the AI assistant...
              </div>
            )}
            {loading && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '2px solid #0F9E99',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                <span style={{ color: '#98521F', fontSize: '0.875rem' }}>
                  Analyzing...
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about specific markets, trading strategies, or analysis..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E0F2F1',
                  backgroundColor: '#F8FAFC',
                  color: '#4A2B1C',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0F9E99'}
                onBlur={(e) => e.target.style.borderColor = '#E0F2F1'}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleAsk()}
                disabled={loading}
              />
              <div style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                marginTop: '4px'
              }}>
                Press Enter to send
              </div>
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              style={loading || !query.trim() ? disabledButtonStyle : askButtonStyle}
              onMouseOver={(e) => !loading && query.trim() && (e.target.style.backgroundColor = '#0C7F7A')}
              onMouseOut={(e) => !loading && query.trim() && (e.target.style.backgroundColor = '#0F9E99')}
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </>
      ) : (
        /* Insights Tab */
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#F0FDF4',
            borderRadius: '8px',
            border: '1px solid #BBF7D0'
          }}>
            <div style={{ color: '#166534', fontSize: '0.875rem' }}>
              <strong>🤖 Auto-Generated Insights</strong> • Updates every 15 minutes
            </div>
            <div style={{ color: '#0F9E99', fontSize: '0.8rem', fontWeight: '600' }}>
              {insights.length} insights
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px'
          }}>
            {insightsLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6B7280'
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  border: '2px solid #0F9E99',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '12px'
                }}></div>
                <div>Loading market insights...</div>
              </div>
            ) : insights.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6B7280',
                fontStyle: 'italic'
              }}>
                No insights yet. First analysis will be generated in a few minutes.
              </div>
            ) : (
              insights.map((insight, index) => (
                <div
                  key={insight.id}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    backgroundColor: index === 0 ? '#F0FDF4' : 'white',
                    border: index === 0 ? '2px solid #0F9E99' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    position: 'relative'
                  }}
                >
                  {/* Insight Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#0F9E99',
                      fontSize: '0.9rem'
                    }}>
                      {formatTime(insight.timestamp)}
                      {index === 0 && (
                        <span style={{
                          marginLeft: '8px',
                          backgroundColor: '#0F9E99',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          LATEST
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#6B7280',
                      textAlign: 'right'
                    }}>
                      📊 {insight.dataSources.cryptoPrices} prices<br/>
                      🎯 {insight.dataSources.predictionMarkets} markets<br/>
                      📰 {insight.dataSources.newsArticles} news
                    </div>
                  </div>

                  {/* Insight Content */}
                  <div style={{
                    color: '#4A2B1C',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {insight.analysis}
                  </div>

                  {/* Storage Status */}
                  {insight.storage && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #E5E7EB',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      fontSize: '0.7rem'
                    }}>
                      {insight.storage.status === 'stored' && (
                        <>
                          <span style={{ color: '#166534' }}>✅ Stored on</span>
                          {insight.storage.ipfs && (
                            <a 
                              href={insight.storage.ipfsUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#0F9E99', textDecoration: 'none' }}
                            >
                              IPFS
                            </a>
                          )}
                          {insight.storage.blockchain && (
                            <a 
                              href={insight.storage.blockchainUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#0F9E99', textDecoration: 'none' }}
                            >
                              Blockchain
                            </a>
                          )}
                        </>
                      )}
                      {insight.storage.status === 'pending' && (
                        <span style={{ color: '#E59B48' }}>⏳ Storing permanently...</span>
                      )}
                      {insight.storage.status === 'failed' && (
                        <span style={{ color: '#DC2626' }}>❌ Storage failed</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}