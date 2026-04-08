import { GoogleGenAI } from "@google/genai";

// Acceso robusto para diferentes entornos (AI Studio y Netlify)
const apiKey = 
  (import.meta.env?.VITE_GEMINI_API_KEY) || 
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
  "";

if (!apiKey) {
  console.warn("Gemini API Key not found. Please set VITE_GEMINI_API_KEY in Netlify or ensure GEMINI_API_KEY is available in AI Studio.");
}

const ai = new GoogleGenAI({ apiKey });

export async function translate(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return "";
  if (!apiKey) return "[Error: API Key missing]";
  
  try {
    const model = (ai as any).getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent(`Translate to ${targetLanguage}. Tone: ${context}. Return ONLY translation. Text: ${text}`);
    return response.response.text() || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "Error";
  }
}

export async function* translateStream(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return;
  if (!apiKey) {
    yield " [Error: API Key missing] ";
    return;
  }

  try {
    const model = (ai as any).getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContentStream(`Translate to ${targetLanguage}. Tone: ${context}. Return ONLY translation. Text: ${text}`);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    yield " [Error de conexión] ";
  }
}
