import { generateImage } from "../_core/imageGeneration";

/**
 * Service for handling image generation requests
 */
export async function generateImageFromPrompt(prompt: string): Promise<string | null> {
  try {
    const result = await generateImage({
      prompt: prompt,
    });

    return result.url || null;
  } catch (error) {
    console.error("[ImageService] Generation failed:", error);
    return null;
  }
}

/**
 * Extract image generation prompt from user message
 */
export function extractImagePrompt(message: string): string | null {
  const imageKeywords = [
    "generate image",
    "create image",
    "draw",
    "paint",
    "illustration",
    "artwork",
    "visual",
    "picture",
    "design",
  ];

  const lowerMessage = message.toLowerCase();

  // Check if message contains image generation keywords
  const hasKeyword = imageKeywords.some((keyword) =>
    lowerMessage.includes(keyword)
  );

  if (!hasKeyword) return null;

  // Extract the actual prompt (everything after the keyword)
  for (const keyword of imageKeywords) {
    const index = lowerMessage.indexOf(keyword);
    if (index !== -1) {
      const promptStart = index + keyword.length;
      const extractedPrompt = message.substring(promptStart).trim();
      return extractedPrompt || message;
    }
  }

  return null;
}

/**
 * Check if message should trigger image generation
 */
export function shouldGenerateImage(message: string): boolean {
  return extractImagePrompt(message) !== null;
}
