import axios from "axios";
import * as db from "./db";

export type ModelProvider = "ollama" | "openrouter" | "openai" | "manus";

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  content: string;
  provider: ModelProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get available models from a provider
 */
export async function getAvailableModels(
  userId: number,
  provider: ModelProvider
): Promise<ModelInfo[]> {
  const config = await db.getProviderConfig(userId, provider);

  if (!config || !config.isActive) {
    return [];
  }

  try {
    switch (provider) {
      case "ollama":
        return await getOllamaModels(config.baseUrl || "http://localhost:11434");
      case "openrouter":
        return await getOpenRouterModels(config.apiKey || "");
      case "openai":
        return await getOpenAIModels(config.baseUrl || "https://api.openai.com/v1", config.apiKey || "");
      case "manus":
        return getManusPredefinedModels();
      default:
        return [];
    }
  } catch (error) {
    console.error(`Failed to fetch models for ${provider}:`, error);
    return [];
  }
}

/**
 * Send a chat message to a model
 */
export async function sendChatMessage(
  userId: number,
  provider: ModelProvider,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const config = await db.getProviderConfig(userId, provider);

  if (!config || !config.isActive) {
    throw new Error(`Provider ${provider} not configured`);
  }

  try {
    switch (provider) {
      case "ollama":
        return await sendOllamaMessage(
          config.baseUrl || "http://localhost:11434",
          model,
          messages,
          systemPrompt
        );
      case "openrouter":
        return await sendOpenRouterMessage(
          config.apiKey || "",
          model,
          messages,
          systemPrompt
        );
      case "openai":
        return await sendOpenAIMessage(
          config.baseUrl || "https://api.openai.com/v1",
          config.apiKey || "",
          model,
          messages,
          systemPrompt
        );
      case "manus":
        throw new Error("Use Manus API integration for Manus tasks");
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Failed to send message to ${provider}:`, error);
    throw error;
  }
}

// ============ Ollama ============
async function getOllamaModels(baseUrl: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get(`${baseUrl}/api/tags`);
    return response.data.models.map((model: any) => ({
      id: model.name,
      name: model.name,
      provider: "ollama" as const,
      description: `${model.size} - ${model.digest?.substring(0, 12)}`,
    }));
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}

async function sendOllamaMessage(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  const response = await axios.post(`${baseUrl}/api/chat`, {
    model,
    messages: fullMessages,
    stream: false,
  });

  return {
    content: response.data.message.content,
    provider: "ollama",
    model,
    usage: response.data.eval_count ? {
      promptTokens: response.data.prompt_eval_count || 0,
      completionTokens: response.data.eval_count || 0,
      totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
    } : undefined,
  };
}

// ============ OpenRouter ============
async function getOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data.data
      .filter((model: any) => !model.name.includes("deprecated"))
      .slice(0, 20) // Limit to top 20 models
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: "openrouter" as const,
        description: model.description,
      }));
  } catch (error) {
    console.error("Failed to fetch OpenRouter models:", error);
    return [];
  }
}

async function sendOpenRouterMessage(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: fullMessages,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://openclaw.app",
        "X-Title": "OpenClaw",
      },
    }
  );

  return {
    content: response.data.choices[0].message.content,
    provider: "openrouter",
    model,
    usage: response.data.usage ? {
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      totalTokens: response.data.usage.total_tokens,
    } : undefined,
  };
}

// ============ OpenAI-Compatible ============
async function getOpenAIModels(baseUrl: string, apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: "openai" as const,
    }));
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    return [];
  }
}

async function sendOpenAIMessage(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: fullMessages,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    content: response.data.choices[0].message.content,
    provider: "openai",
    model,
    usage: response.data.usage ? {
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      totalTokens: response.data.usage.total_tokens,
    } : undefined,
  };
}

// ============ Manus ============
function getManusPredefinedModels(): ModelInfo[] {
  return [
    {
      id: "manus-standard",
      name: "Manus Standard",
      provider: "manus",
      description: "Standard Manus agent for general tasks",
    },
    {
      id: "manus-lite",
      name: "Manus Lite",
      provider: "manus",
      description: "Lightweight Manus agent for quick tasks",
    },
    {
      id: "manus-max",
      name: "Manus Max",
      provider: "manus",
      description: "Advanced Manus agent with full capabilities",
    },
  ];
}
