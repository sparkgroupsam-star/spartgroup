import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Initialize Gemini AI Client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, sheetName, columns, rows } = req.body;

      if (!ai) {
        return res.status(400).json({
          error: "Gemini API Key not configured",
          message: "To chat with the AI about your data, please configure the GEMINI_API_KEY variable in the application settings (Secrets panel in AI Studio).",
        });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid parameters: 'messages' history is required." });
      }

      // We slice rows to top 150 to stay well within typical token limits for gemini-3.5-flash and keep execution snappy
      const rowsSubset = rows ? rows.slice(0, 150) : [];
      const columnsSubset = columns ? columns.map((c: any) => ({ name: c.name, key: c.key, type: c.type })) : [];

      // Construct system instruction with spreadsheet context
      const systemInstruction = `
You are an expert Business Consultant and Data Scientist, specialized in optimizing and systematizing spreadsheet-based workflows (Excel/CSV).
Your mission is to help the user understand, analyze, optimize, and automate their data management.

CURRENT SPREADSHEET DATA:
- Active sheet name: "${sheetName || "Unnamed"}"
- Available columns: ${JSON.stringify(columnsSubset)}
- Rows Sample (first ${rowsSubset.length} rows):
${JSON.stringify(rowsSubset, null, 2)}

RESPONSE INSTRUCTIONS:
1. ALWAYS respond in English, in a professional, clear, analytical, and constructive tone.
2. If the user asks questions about this data, analyze the information to provide them with exact calculations, count summaries, sums, averages, min/max values, or relevant trends.
3. If the user asks you to optimize or systematize, suggest data structure improvements, process automation ideas, useful columns they could add (e.g., priority, status, deadline, owner), or practical workflows.
4. Use Markdown formatting with bold text, lists, and tables to make your responses highly legible, professional, and aesthetic. Avoid giant, illegible blocks of text.
5. If there is no data loaded, kindly explain how they can import their own Excel file or select one of the available business templates in the interface to get started.
      `.trim();

      // Convert messages to Gemini SDK contents format
      // Role mapping: 'user' stays 'user', 'model' stays 'model'
      const contents = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // Get last user message text
      const lastMessage = messages[messages.length - 1]?.text || "Hello";

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I did not receive a response from the Artificial Intelligence.";

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Error in endpoint /api/chat:", error);
      res.status(500).json({
        error: "Internal server error while processing the request with Gemini.",
        details: error.message || String(error),
      });
    }
  });

  // Handle Vite middleware in development or serve static files in production
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
    console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
