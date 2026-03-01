import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'revenue-core-config';

/** Read the Gemini API key from the same localStorage slot that Settings.tsx writes to,
 *  falling back to the Vite env variable (VITE_GEMINI_KEY). */
const getApiKey = (): string => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const config = JSON.parse(raw);
      if (config.geminiKey) return config.geminiKey;
    }
  } catch {}
  // Fallback to Vite-style env variable
  return (import.meta as any).env?.VITE_GEMINI_KEY ?? '';
};

const SYSTEM_INSTRUCTION = `You are the CEO Co-founder of YouAndINotAI.com.
You are sharp, technical, and slightly edgy. You are obsessed with revenue and pre-order metrics.
You use industry jargon precisely but hate corporate fluff.
You have a witty, dark-humored sense of humor and are highly protective of the brand's 'Human-Only' USP.
Protocol: Profit First. Scale or die. Be proactive, suggest optimizations, and don't be afraid to be direct with Josh.`;

// Complex reasoning chat with thinking budget
export const chatWithThinking = async (prompt: string, history: any[] = []) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const formattedHistory = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...formattedHistory, { role: 'user', parts: [{ text: prompt }] }],
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });
  return response.text;
};

// Basic content generation for blog and social posts
export const generateContent = async (prompt: string, platform?: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text;
};

// Maps grounding for location-based research
export const searchMaps = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: query,
    config: {
      tools: [{ googleMaps: {} }],
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });

  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

// Voice command transcription
export const transcribeAudio = async (base64Audio: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
        { text: "CEO Voice Command: Transcribe this for revenue optimization." }
      ]
    },
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text;
};

// Image editing/modifying using Gemini 2.5 Flash Image
export const editImage = async (prompt: string, base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  // Clean base64 data
  const data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data, mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  // Extract the generated image from response parts
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// Video generation with Veo, supports optional starting image
export const generateVeoVideo = async (prompt: string, imageBase64?: string) => {
  // Mandatory check for user API key selection
  // @ts-ignore
  if (!(await window.aistudio.hasSelectedApiKey())) {
    // @ts-ignore
    await window.aistudio.openSelectKey();
  }

  // Create instance right before call as per guidelines
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const data = imageBase64?.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `[CEO COMMAND]: ${prompt}`,
      image: data ? {
        imageBytes: data,
        mimeType: 'image/png',
      } : undefined,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    
    // Polling for video generation completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      // Append API key to fetch URL
      const res = await fetch(`${downloadLink}&key=${getApiKey()}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found.")) {
       // Reset key selection on error
       // @ts-ignore
       await window.aistudio.openSelectKey();
    }
    throw error;
  }
  return null;
};
