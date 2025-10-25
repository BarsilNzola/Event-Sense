import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import predictionRoutes from "./routes/predictionRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/predictions", predictionRoutes);

// Routes
app.get("/", (req, res) => res.send("EventSense backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));