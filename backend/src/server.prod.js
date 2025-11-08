import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('Production server starting...');

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
import predictionRoutes from "./routes/predictionRoutes.js";
import aiRoutes from "./routes/ai.js";
import priceRoutes from "./routes/priceRoutes.js";
import newsRoutes from "./routes/news.js";

// Import services
import "./services/polymarket/polymarketService.js";
import "./services/news/newsService.js"; 
import "./services/ai/autoInsightsService.js";

// Use routes
app.use("/api/predictions", predictionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/news", newsRoutes);

const distPath = path.join(__dirname, "..", "dist");

// Serve static files
app.use(express.static(distPath));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API root
app.get("/api", (req, res) => res.json({ 
  message: "EventSense backend running",
  endpoints: {
    predictions: "/api/predictions",
    ai: "/api/ai",
    prices: "/api/prices", 
    news: "/api/news",
    health: "/health"
  }
}));

// FALLBACK MIDDLEWARE INSTEAD OF CATCH-ALL ROUTE
app.use((req, res, next) => {
  // If no route has matched and it's not an API call, serve the SPA
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    // If it's an API call that hasn't been handled, return 404
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});