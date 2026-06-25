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
          error: "API Key de Gemini no configurada",
          message: "Para poder chatear con la IA sobre tus datos, por favor configura la variable GEMINI_API_KEY en la configuración de la aplicación (panel de Secrets en AI Studio).",
        });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Parámetros inválidos: se requiere el historial de 'messages'." });
      }

      // We slice rows to top 150 to stay well within typical token limits for gemini-3.5-flash and keep execution snappy
      const rowsSubset = rows ? rows.slice(0, 150) : [];
      const columnsSubset = columns ? columns.map((c: any) => ({ name: c.name, key: c.key, type: c.type })) : [];

      // Construct system instruction with spreadsheet context
      const systemInstruction = `
Eres un Consultor de Negocios y Científico de Datos experto, especializado en optimizar y sistematizar flujos de trabajo basados en hojas de cálculo (Excel/CSV).
Tu misión es ayudar al usuario a entender, analizar, optimizar y automatizar la gestión de sus datos.

DATOS ACTUALES DE LA HOJA DE CÁLCULO:
- Nombre de la hoja activa: "${sheetName || "Sin nombre"}"
- Columnas disponibles: ${JSON.stringify(columnsSubset)}
- Muestra de Filas (primeras ${rowsSubset.length} filas):
${JSON.stringify(rowsSubset, null, 2)}

INSTRUCCIONES DE RESPUESTA:
1. Responde SIEMPRE en español, con un tono profesional, claro, analítico y constructivo.
2. Si el usuario te hace preguntas sobre estos datos, analiza la información para proporcionarle cálculos exactos, resúmenes de conteo, sumas, promedios, valores mínimos/máximos o tendencias relevantes.
3. Si el usuario te pide optimizar o sistematizar, sugiérele mejoras de estructura de datos, ideas de automatización de procesos, columnas útiles que podría agregar (por ejemplo: columna de prioridad, estado, fecha límite, responsable) o flujos de trabajo prácticos.
4. Usa formato Markdown con negritas, listas y tablas para que tus respuestas sean sumamente legibles, profesionales y estéticas. Evita bloques de texto gigantes e ilegibles.
5. Si no hay datos cargados, explícale de forma amable cómo puede importar su propio archivo Excel o seleccionar una de las plantillas de negocio disponibles en la interfaz para comenzar.
      `.trim();

      // Convert messages to Gemini SDK contents format
      // Role mapping: 'user' stays 'user', 'model' stays 'model'
      const contents = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // Get last user message text
      const lastMessage = messages[messages.length - 1]?.text || "Hola";

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "No obtuve respuesta de la Inteligencia Artificial.";

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Error en endpoint /api/chat:", error);
      res.status(500).json({
        error: "Error interno del servidor al procesar la solicitud con Gemini.",
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
    console.log(`[Server] Corriendo en puerto ${PORT} en modo ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
