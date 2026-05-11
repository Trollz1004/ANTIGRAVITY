import { generateImage } from "./_core/imageGeneration";
import * as db from "./db";

/**
 * Image Generation Service for OpenClaw
 * Integrates with Manus built-in image generation
 */

export interface ImageGenerationRequest {
  prompt: string;
  sessionId: number;
  userId: number;
  style?: "realistic" | "artistic" | "abstract" | "cyberpunk";
  size?: "256x256" | "512x512" | "1024x1024";
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  generatedAt: Date;
  messageId?: number | undefined;
}

/**
 * Generate image from prompt and add to chat
 */
export async function generateImageForChat(
  request: ImageGenerationRequest
): Promise<GeneratedImage> {
  try {
    // Build enhanced prompt with style
    let enhancedPrompt = request.prompt;
    if (request.style) {
      const styleDescriptions: Record<string, string> = {
        realistic: "photorealistic, high quality, detailed, 4k",
        artistic: "artistic painting style, watercolor, oil painting",
        abstract: "abstract art, geometric shapes, modern",
        cyberpunk: "cyberpunk aesthetic, neon colors, futuristic, dark",
      };
      enhancedPrompt = `${request.prompt}. Style: ${styleDescriptions[request.style]}`;
    }

    console.log(`[ImageGen] Generating image for session ${request.sessionId}`);
    console.log(`[ImageGen] Prompt: ${enhancedPrompt}`);

    // Call Manus image generation
    const result = await generateImage({
      prompt: enhancedPrompt,
    });

    const generatedImage: GeneratedImage = {
      url: result.url || "",
      prompt: request.prompt,
      generatedAt: new Date(),
    };

    // Add image to chat as assistant message
    const messageResult = await db.createChatMessage(
      request.sessionId,
      "assistant",
      `![Generated Image](${result.url})\n\n*Generated from: "${request.prompt}"*`,
      "image-gen",
      "manus-image",
      {
        imageUrl: result.url,
        originalPrompt: request.prompt,
        enhancedPrompt,
        style: request.style || undefined,
      }
    );

    generatedImage.messageId = (messageResult as any).insertId;

    console.log(`[ImageGen] Image generated successfully: ${result.url}`);

    return generatedImage;
  } catch (error) {
    console.error("[ImageGen] Failed to generate image:", error);
    throw error;
  }
}

/**
 * Generate multiple images for comparison
 */
export async function generateMultipleImages(
  prompt: string,
  count: number = 3,
  sessionId?: number,
  userId?: number
): Promise<GeneratedImage[]> {
  try {
    const images: GeneratedImage[] = [];

    for (let i = 0; i < count; i++) {
      // Add variation to prompt for each image
      const variedPrompt = `${prompt} (variation ${i + 1})`;

      const result = await generateImage({
        prompt: variedPrompt,
      });

      images.push({
        url: result.url || "",
        prompt,
        generatedAt: new Date(),
      });

      // Small delay between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return images;
  } catch (error) {
    console.error("[ImageGen] Failed to generate multiple images:", error);
    throw error;
  }
}

/**
 * Edit image based on prompt
 */
export async function editImage(
  imageUrl: string,
  editPrompt: string,
  sessionId: number,
  userId: number
): Promise<GeneratedImage> {
  try {
    console.log(`[ImageGen] Editing image with prompt: ${editPrompt}`);

    const result = await generateImage({
      prompt: editPrompt,
      originalImages: [
        {
          url: imageUrl,
          mimeType: "image/jpeg",
        },
      ],
    });

    const generatedImage: GeneratedImage = {
      url: result.url || "",
      prompt: editPrompt,
      generatedAt: new Date(),
    };

    // Add edited image to chat
    const messageResult2 = await db.createChatMessage(
      sessionId,
      "assistant",
      `![Edited Image](${result.url})\n\n*Edit: "${editPrompt}"*`,
      "image-gen",
      "manus-image-edit",
      {
        imageUrl: result.url,
        editPrompt,
        originalImageUrl: imageUrl,
      }
    );

    generatedImage.messageId = (messageResult2 as any).insertId;

    console.log(`[ImageGen] Image edited successfully: ${result.url}`);

    return generatedImage;
  } catch (error) {
    console.error("[ImageGen] Failed to edit image:", error);
    throw error;
  }
}

/**
 * Parse image generation request from chat message
 */
export function parseImageGenerationRequest(message: string): ImageGenerationRequest | null {
  // Check for image generation keywords
  const imageKeywords = [
    "generate image",
    "create image",
    "draw",
    "paint",
    "illustrate",
    "make a picture",
    "image of",
  ];

  const hasImageKeyword = imageKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );

  if (!hasImageKeyword) {
    return null;
  }

  // Extract style if mentioned
  const styleMatch = message.match(/(realistic|artistic|abstract|cyberpunk)/i);
  const style = styleMatch ? (styleMatch[1].toLowerCase() as any) : undefined;

  // Extract size if mentioned
  const sizeMatch = message.match(/(256|512|1024)/);
  const size = sizeMatch
    ? (`${sizeMatch[1]}x${sizeMatch[1]}` as any)
    : "512x512";

  // Remove image generation keywords to get the actual prompt
  let prompt = message;
  imageKeywords.forEach((keyword) => {
    prompt = prompt.replace(new RegExp(keyword, "gi"), "");
  });

  prompt = prompt
    .replace(/\b(realistic|artistic|abstract|cyberpunk)\b/gi, "")
    .replace(/\b(256|512|1024)\b/g, "")
    .trim();

  return {
    prompt: prompt || "a beautiful image",
    sessionId: 0, // Will be set by caller
    userId: 0, // Will be set by caller
    style: style as any,
    size: size as any,
  };
}
