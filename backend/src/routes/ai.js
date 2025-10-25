import express from "express";
import { OpenAI } from "openai";

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/ai/query
router.post("/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing question." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are EventSense AI, an assistant analyzing crypto prediction market trends.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_tokens: 250,
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error("AI query error:", error);
    res.status(500).json({ error: "AI response failed." });
  }
});

export default router;
