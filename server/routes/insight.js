import express from "express";
import { buildWeeklyInsightPrompt } from "../insightReportPrompt.js";
import { google } from "@google-ai/generativelanguage";

const router = express.Router();
const client = new google.generativelanguage.GenerativeServiceClient({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/weekly-report", async (req, res) => {
  try {
    const data = req.body;
    const prompt = buildWeeklyInsightPrompt(data);

    const result = await client.models.generateText({
      model: "gemini-2.0-flash",
      prompt: prompt,
      temperature: 0.7,
    });

    const text = result?.candidates?.[0]?.outputText || "";

    res.json({ report: text });
  } catch (e) {
    console.error("Insight report error:", e);
    res.status(500).json({ error: "Report generation failed" });
  }
});

export default router;
