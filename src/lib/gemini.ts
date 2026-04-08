import { GoogleGenerativeAI } from "@google/generative-ai";

// Acceso robusto para diferentes entornos (AI Studio y Netlify)
const getApiKey = () => {
  try {
    // En Vite, import.meta.env es la forma estándar
    const metaEnv = (import.meta as any).env;
    const envKey = metaEnv?.VITE_GEMINI_API_KEY || metaEnv?.GEMINI_API_KEY;
    if (envKey) return envKey;

    // Fallback para entornos Node o configuraciones específicas
    if (typeof window !== 'undefined' && (window as any).process?.env?.GEMINI_API_KEY) {
      return (window as any).process.env.GEMINI_API_KEY;
    }
    
    return "";
  } catch {
    return "";
  }
};

const apiKey = getApiKey();

// Lazy initialization to prevent top-level crashes if API key is missing
let genAI: any = null;

function getAI() {
  if (!genAI) {
    const key = getApiKey();
    if (!key) {
      throw new Error("Gemini API Key missing. Please configure it in Settings.");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export async function translate(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return "";
  
  // Lista de modelos a probar en orden de preferencia
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const ai = getAI();
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`Translate to ${targetLanguage}. Tone: ${context}. Return ONLY translation. Text: ${text}`);
      const response = await result.response;
      const translatedText = response.text();
      if (translatedText) return translatedText;
    } catch (error: any) {
      console.warn(`Failed with model ${modelName}:`, error?.message);
      lastError = error;
      // Si es un error de 404 (modelo no encontrado), intentamos el siguiente
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        continue;
      }
      // Si es otro tipo de error (como cuota), paramos
      break;
    }
  }

  return `[Error: ${lastError?.message || 'Unknown'}]`;
}

export async function* translateStream(text: string, targetLanguage: string, context: string = "casual, natural, persuasive") {
  if (!text.trim()) return;

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContentStream(`Translate to ${targetLanguage}. Tone: ${context}. Return ONLY translation. Text: ${text}`);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    console.error("Stream error:", error);
    yield ` [Error: ${error?.message?.substring(0, 30) || 'Conexión'}] `;
  }
}
