import { getApiBaseUrl } from '../config/api';

export const getPredictionSummary = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/predictions/analyze`);
    return response.json();
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
};