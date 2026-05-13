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
let aiInstance: any = null;

async function getAI() {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key) {
      throw new Error("Gemini API Key missing. Please configure it in Settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export async function translate(text: string, _targetLanguage: string = "English", _context: string = "") {
  if (!text.trim()) return "";
  
  try {
    const ai = await getAI();
    const systemPrompt = "You are a real-time English translator for a conversational webcam model. Translate the following Spanish text to English. Maintain a human, natural, and engaging tone. Avoid robotic language, salesperson vibes, or cliché dominatrix tropes. Return ONLY the translated English string, with absolutely no additional text, quotes, or markdown.";

    // Petición ultra-ligera sin historial para mínima latencia
    // Usamos gemini-2.0-flash para máxima velocidad si está disponible, sino 1.5 flash
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nText to translate: ${text}` }]
        }
      ],
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ] as any,
        temperature: 0.7,
      }
    });
    
    return response.text || "";
  } catch (error: any) {
    console.error("Translation error:", error);
    let msg = error?.message || 'Error';
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message) msg = parsed.error.message;
    } catch {
      // Si no es JSON, limpiamos un poco el mensaje
      msg = msg.split('\n')[0].substring(0, 50);
    }
    return `[Error: ${msg}]`;
  }
}
