import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Groq Chat Completions Proxy Endpoint (Qwen models)
  app.post("/api/groq/chat", async (req, res) => {
    try {
      const { messages, model, temperature, max_tokens, customApiKey } = req.body;
      const apiKey = process.env.GROQ_API_KEY || customApiKey;

      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        return res.status(400).json({
          error: "کلیل (API Key)ی Groq نەدۆزرایەوە! تکایە کلیلەکەت لە ڕێکخستنەکان یان لە .env دابنێ.",
          code: "MISSING_API_KEY",
        });
      }

      // Default to requested model or active Groq Qwen model (qwen/qwen3.6-27b)
      let selectedModel = model && String(model).trim() ? String(model).trim() : "qwen/qwen3.6-27b";

      // Normalize common aliases and decommissioned model names
      if (selectedModel === "qwen-2.5-32b" || selectedModel === "qwen/qwen3.6" || selectedModel === "qwen3.6") {
        selectedModel = "qwen/qwen3.6-27b";
      } else if (selectedModel === "qwen/qwen3.8" || selectedModel === "qwen3.8") {
        selectedModel = "qwen/qwen3.8-27b";
      }

      // Safe max_tokens to prevent Groq OTPM (Output Tokens Per Minute) 1000 rate limit
      let safeMaxTokens = typeof max_tokens === "number" && max_tokens > 0 ? max_tokens : 800;
      if (selectedModel.includes("qwen") && safeMaxTokens > 900) {
        safeMaxTokens = 850;
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: typeof temperature === "number" ? temperature : 0.2,
          max_tokens: safeMaxTokens,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If it was rate limited on tokens, try one retry with lower max_tokens
        if (responseData.error?.code === "rate_limit_exceeded" && safeMaxTokens > 500) {
          console.warn("Retrying Groq call with lower max_tokens (500)...");
          const retryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey.trim()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: selectedModel,
              messages,
              temperature: typeof temperature === "number" ? temperature : 0.2,
              max_tokens: 500,
            }),
          });
          const retryData = await retryRes.json();
          if (retryRes.ok) {
            return res.json(retryData);
          }
        }

        return res.status(response.status).json({
          error: responseData.error?.message || "هەڵەیەک ڕوویدا لە پەیوەندی بە Groq API",
          details: responseData,
        });
      }

      return res.json(responseData);
    } catch (error: any) {
      console.error("Groq API proxy error:", error);
      return res.status(500).json({
        error: error.message || "هەڵەی ناوخۆیی لە ئەنجامدانی پەیوەندی بە Groq",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
