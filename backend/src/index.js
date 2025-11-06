import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Looking for .env at:', path.resolve(__dirname, '../../.env'));

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug environment variables
console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? 'SET' : 'NOT SET');

const app = express();

app.use(cors());
app.use(express.json());

import predictionRoutes from "./routes/predictionRoutes.js";
import aiRoutes from "./routes/ai.js";
import priceRoutes from "./routes/priceRoutes.js";

app.use("/api/predictions", predictionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prices", priceRoutes);

app.get("/", (req, res) => res.send("EventSense backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));