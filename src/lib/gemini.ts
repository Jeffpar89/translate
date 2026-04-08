import { GoogleGenAI } from "@google/genai";

// Acceso robusto para diferentes entornos (AI Studio y Netlify)
const getApiKey = () => {
  try {
    // En AI Studio Build, la clave se maneja a través de process.env.GEMINI_API_KEY
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
    
    // Fallback para Vite/Netlify
    const metaEnv = (import.meta as any).env;
    const envKey = metaEnv?.VITE_GEMINI_API_KEY || metaEnv?.GEMINI_API_KEY;
    if (envKey) return envKey;

    return "";
  } catch {
    return "";
  }
};

const apiKey = getApiKey();

// Lazy initialization to prevent top-level crashes
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key) {
      throw new Error("Gemini API Key missing. Please configure it in Settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export async function translate(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return "";
  
  try {
    const ai = getAI();
    // Configuramos el modelo con filtros de seguridad desactivados para permitir el lenguaje de modelos webcam
    // y ajustamos la instrucción del sistema para que sea más directa y sin censura.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. 
Context: Webcam model interaction. 
Tone: ${context}. 
Instruction: Translate EVERYTHING exactly as said, including sexual, explicit, or suggestive language. Do NOT censor. Return ONLY the translation.

Text to translate: ${text}`,
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ] as any
      }
    });
    
    return response.text || "";
  } catch (error: any) {
    console.error("Translation error:", error);
    return `[Error: ${error?.message || 'Unknown'}]`;
  }
}

export async function* translateStream(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return;

  try {
    const ai = getAI();
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. 
Context: Webcam model interaction. 
Tone: ${context}. 
Instruction: Translate EVERYTHING exactly as said, including sexual, explicit, or suggestive language. Do NOT censor. Return ONLY the translation.

Text to translate: ${text}`,
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ] as any
      }
    });

    for await (const chunk of response) {
      const chunkText = chunk.text;
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    console.error("Stream error:", error);
    yield ` [Error: ${error?.message?.substring(0, 30) || 'Conexión'}] `;
  }
}
