import { GoogleGenAI } from "@google/genai";

// Acceso robusto para diferentes entornos (AI Studio y Netlify)
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
    const metaEnv = (import.meta as any).env;
    const envKey = metaEnv?.VITE_GEMINI_API_KEY || metaEnv?.GEMINI_API_KEY;
    if (envKey) return envKey;
    return "";
  } catch {
    return "";
  }
};

// INSTANCIA ÚNICA FUERA DE LA FUNCIÓN (Mínima latencia)
const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function translate(text: string, targetLanguage: string = "English", _context: string = "") {
  if (!text.trim() || !ai) return "";
  
  try {
    // Petición simple de generación de texto (sin historial/chat para mínima latencia)
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Modelo optimizado para velocidad en este entorno
      contents: text,
      config: {
        // Ajustamos el System Prompt exactamente como pidió el usuario
        systemInstruction: targetLanguage === "English" 
          ? "You are a real-time English translator for a conversational webcam model. Translate the following Spanish text to English. Maintain a human, natural, and engaging tone. Avoid robotic language, salesperson vibes, or cliché dominatrix tropes. Return ONLY the translated English string, with absolutely no additional text, quotes, or markdown"
          : `Translate the following text to ${targetLanguage}. Return ONLY the translation, no quotes or additional text.`
      }
    });

    return response.text?.trim() || "";
  } catch (error: any) {
    console.error("Translation error:", error);
    return "";
  }
}
