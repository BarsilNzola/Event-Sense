import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// POST /api/ai/query
router.post("/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing question." });
    }

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
