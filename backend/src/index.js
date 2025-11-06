import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Environment loaded');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
import predictionRoutes from "./routes/predictionRoutes.js";
import aiRoutes from "./routes/ai.js";
import priceRoutes from "./routes/priceRoutes.js";
import newsRoutes from "./routes/news.js";

// Import services (they auto-start in their constructors)
import "./services/polymarket/polymarketService.js";
import "./services/news/newsService.js"; 
import "./services/ai/autoInsightsService.js";

// Use routes
app.use("/api/predictions", predictionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/news", newsRoutes);

// Simple health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
});

app.get("/", (req, res) => res.json({ 
  message: "EventSense backend running",
  endpoints: {
    predictions: "/api/predictions",
    ai: "/api/ai",
    prices: "/api/prices", 
    news: "/api/news",
    health: "/health"
  }
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});