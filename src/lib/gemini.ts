import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
};

const apiKey = getApiKey();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function translate(text: string, targetLanguage: string = "English", context: string = "") {
  if (!text.trim()) return "";
  if (!genAI) {
    console.error("Gemini API Key missing");
    return "[Error: API Key missing]";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
      }
    });

    const systemPrompt = "You are a real-time English translator for a conversational webcam model. Translate the following Spanish text to English. Maintain a human, natural, and engaging tone. Avoid robotic language, salesperson vibes, or cliché dominatrix tropes. Return ONLY the translated English string, with absolutely no additional text, quotes, or markdown.";
    
    const prompt = `${systemPrompt}\n\nContext: ${context}\n\nText to translate: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("Translation error:", error);
    return `[Error: ${error.message || "Unknown error"}]`;
  }
}
