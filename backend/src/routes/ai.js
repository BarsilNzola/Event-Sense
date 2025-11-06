import express from "express";
import { generateAISummary, generateAIResponse } from "../services/ai/aiService.js";

const router = express.Router();

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

    // 🧩 Otherwise, handle a custom question
    if (question) {
      const answer = await generateAIResponse(question);
      return res.json({ answer });
    }

  } catch (error) {
    console.error("AI query error:", error.message);
    
    res.json({ 
      answer: "I'm currently analyzing the market data. Please check the individual market cards for detailed probabilities and trends."
    });
  }
});

export default router;