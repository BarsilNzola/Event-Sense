import express from "express";
import { generateAISummary } from "../services/aiService.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

router.post("/query", async (req, res) => {
  try {
    const { question, data } = req.body;

    if (!question && !data) {
      return res.status(400).json({ error: "Missing question or data." });
    }

    // 🧠 If market data is provided, use the summarizer
    if (data) {
      const summary = await generateAISummary(data);
      return res.json({ answer: summary });
    }

    // Otherwise, default to simple question mode
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      {
        inputs: `You are EventSense AI, an assistant analyzing crypto prediction market trends.\nQuestion: ${question}`,
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer =
      response.data && Array.isArray(response.data)
        ? response.data[0].generated_text
        : "No response received from AI.";

    res.json({ answer });
  } catch (error) {
    console.error("AI query error:", error.response?.data || error.message);
    res.status(500).json({ error: "AI response failed." });
  }
});

export default router;
