import { GoogleGenAI } from "@google/genai";

// Acceso directo según guías de AI Studio para máxima compatibilidad
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function translate(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate to ${targetLanguage}. Tone: ${context}. Return ONLY translation. Text: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "Error";
  }
}

export async function* translateStream(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return;

  try {
    const result = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Translate to ${targetLanguage}. Tone: ${context}. Return ONLY translation. Text: ${text}`,
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    yield " [Error de conexión] ";
  }
}
