import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs'; // ADD THIS IMPORT

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('Production server starting...');
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

// DEBUG: Check where dist actually is
const distPath = path.join(__dirname, "..", "dist");
console.log('Current directory:', __dirname);
console.log('Correct dist path:', distPath);
console.log('Dist exists:', fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  console.log('Files in dist:', fs.readdirSync(distPath));
}

// Serve static files from vite build - GO UP ONE LEVEL to find dist
app.use(express.static(distPath));

// Simple health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
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

// Handle React routing, return all requests to React app
app.get("/:path*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend served from: ${distPath}`);
}); 