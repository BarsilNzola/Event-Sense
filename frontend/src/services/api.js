import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getPredictionSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/predictions/analyze`);
    return response.data;
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
};
