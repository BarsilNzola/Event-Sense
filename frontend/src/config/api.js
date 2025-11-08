export const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return '/api';
    }
    return 'http://localhost:5000/api';
  };