
import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API functionality will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "DISABLED" });

export const getGeminiAssistance = async (
  userQuestion: string
): Promise<{ text: string; sources?: GroundingChunk[] }> => {
  if (!API_KEY) {
    return { text: "Gemini API key not configured. This feature is unavailable." };
  }

  const model = "gemini-2.5-flash";
  const prompt = `You are an expert IT support assistant. A user is following a guide to set up their PC as a NAS (Network Attached Storage) and a web server for their website 'OnlineRecycle.Net'. The user has the following question: "${userQuestion}". Please provide a clear, concise, and actionable answer relevant to this PC setup task. If the question involves recent events or requires up-to-date web information, use your search tool. If the question is unrelated, politely state that you can only assist with topics related to the NAS and web server setup.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // Only enable search if it seems like the question might need it.
        // For general troubleshooting, search might not always be necessary.
        // Let's enable it by default for broader help.
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks as GroundingChunk[] || undefined;

    return { text, sources };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             return { text: "The configured Gemini API key is invalid. Please check your API_KEY environment variable." };
        }
         return { text: `An error occurred while contacting the AI assistant: ${error.message}` };
    }
    return { text: "An unknown error occurred while contacting the AI assistant." };
  }
};