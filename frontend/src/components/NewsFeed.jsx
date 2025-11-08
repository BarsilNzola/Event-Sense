import { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaRegClock, FaSync } from "react-icons/fa";
import { getApiBaseUrl } from '../config/api';

export default function NewsFeed() {
  const [news, setNews] = useState({ articles: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchNews = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(`${getApiBaseUrl()}/news`);
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const filteredArticles = selectedCategory === 'all' 
    ? news.articles 
    : news.articles.filter(article => article.category === selectedCategory);

  const categories = [
    { key: 'all', label: 'All News', count: news.articles.length },
    { key: 'crypto', label: 'Crypto', count: news.articles.filter(a => a.category === 'crypto').length },
    { key: 'general', label: 'Business', count: news.articles.filter(a => a.category === 'general').length }
  ];

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E0F2F1'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #0F9E99',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#98521F', fontSize: '0.875rem' }}>
            Loading market news...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E0F2F1'
    }}>
      {/* Header */}
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
          Market News
        </h3>
        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          style={{
            background: 'none',
            border: 'none',
            color: '#0F9E99',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#E0F2F1'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <FaSync className={refreshing ? 'spin' : ''} size={14} />
        </button>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {categories.map(category => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategory === category.key ? '#0F9E99' : '#E0F2F1',
              color: selectedCategory === category.key ? 'white' : '#0F9E99',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {category.label}
            <span style={{
              fontSize: '0.7rem',
              opacity: 0.8,
              background: selectedCategory === category.key ? 'rgba(255,255,255,0.2)' : 'rgba(15, 158, 153, 0.1)',
              padding: '2px 6px',
              borderRadius: '10px'
            }}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* News List */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, index) => (
            <div
              key={article.id}
              style={{
                padding: '16px',
                borderBottom: index < filteredArticles.length - 1 ? '1px solid #E5E7EB' : 'none',
                transition: 'background-color 0.3s',
                backgroundColor: 'white'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px',
                gap: '12px'
              }}>
                <h4 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#4A2B1C',
                  lineHeight: '1.4',
                  flex: 1,
                  margin: 0
                }}>
                  {article.title}
                </h4>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#0F9E99',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}
                  title="Open article"
                >
                  <FaExternalLinkAlt size={12} />
                </a>
              </div>

              {article.description && (
                <p style={{
                  fontSize: '0.8rem',
                  color: '#98521F',
                  lineHeight: '1.4',
                  marginBottom: '8px'
                }}>
                  {article.description.length > 120 
                    ? `${article.description.substring(0, 120)}...` 
                    : article.description
                  }
                </p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.7rem',
                color: '#6B7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: article.category === 'crypto' ? '#E0F2F1' : '#F3F4F6',
                    color: article.category === 'crypto' ? '#0F9E99' : '#6B7280',
                    fontSize: '0.65rem',
                    fontWeight: '500'
                  }}>
                    {article.source}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaRegClock size={10} />
                  {formatTime(article.publishedAt)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#6B7280', 
            padding: '40px 20px',
            fontSize: '0.875rem'
          }}>
            No news articles found for this category.
            <br />
            <button
              onClick={() => fetchNews(true)}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#0F9E99',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Try Refresh
            </button>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredArticles.length > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>Showing {filteredArticles.length} articles</span>
            {news.timestamp && (
              <span>• Updated {formatTime(news.timestamp)}</span>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}