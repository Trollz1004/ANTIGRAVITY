import axios from "axios";

/**
 * Ollama Cloud Integration Service
 * Handles communication with Ollama Cloud API for hosted model access
 */

export interface OllamaCloudConfig {
  apiKey: string;
  endpoint: string; // Default: https://ollama.com/v1
}

export interface OllamaCloudModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxTokens?: number;
}

export interface OllamaCloudChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaCloudResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Create Ollama Cloud API client
 */
export function createOllamaCloudClient(config: OllamaCloudConfig) {
  const client = axios.create({
    baseURL: config.endpoint || "https://ollama.com/v1",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  return {
    /**
     * List available models from Ollama Cloud
     */
    async listModels(): Promise<OllamaCloudModel[]> {
      try {
        const response = await client.get("/models");
        return response.data.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id,
          description: model.description,
          contextWindow: model.context_window,
          maxTokens: model.max_tokens,
        }));
      } catch (error) {
        console.error("Failed to list Ollama Cloud models:", error);
        throw error;
      }
    },

    /**
     * Send chat completion request to Ollama Cloud
     */
    async sendChatCompletion(
      model: string,
      messages: OllamaCloudChatMessage[],
      options?: {
        temperature?: number;
        topP?: number;
        maxTokens?: number;
        stream?: boolean;
      }
    ): Promise<OllamaCloudResponse> {
      try {
        const response = await client.post("/chat/completions", {
          model,
          messages,
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 0.9,
          max_tokens: options?.maxTokens || 2048,
          stream: options?.stream || false,
        });

        return {
          content: response.data.choices[0].message.content,
          model,
          usage: response.data.usage ? {
            promptTokens: response.data.usage.prompt_tokens,
            completionTokens: response.data.usage.completion_tokens,
            totalTokens: response.data.usage.total_tokens,
          } : undefined,
        };
      } catch (error) {
        console.error("Failed to send chat completion to Ollama Cloud:", error);
        throw error;
      }
    },

    /**
     * Stream chat completion from Ollama Cloud
     */
    async *streamChatCompletion(
      model: string,
      messages: OllamaCloudChatMessage[],
      options?: {
        temperature?: number;
        topP?: number;
        maxTokens?: number;
      }
    ) {
      try {
        const response = await client.post(
          "/chat/completions",
          {
            model,
            messages,
            temperature: options?.temperature || 0.7,
            top_p: options?.topP || 0.9,
            max_tokens: options?.maxTokens || 2048,
            stream: true,
          },
          {
            responseType: "stream",
          }
        );

        for await (const chunk of response.data) {
          const lines = chunk.toString().split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices[0]?.delta?.content) {
                  yield parsed.choices[0].delta.content;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to stream chat completion from Ollama Cloud:", error);
        throw error;
      }
    },

    /**
     * Get model details
     */
    async getModel(modelId: string): Promise<OllamaCloudModel> {
      try {
        const response = await client.get(`/models/${modelId}`);
        return {
          id: response.data.id,
          name: response.data.name || response.data.id,
          description: response.data.description,
          contextWindow: response.data.context_window,
          maxTokens: response.data.max_tokens,
        };
      } catch (error) {
        console.error("Failed to get Ollama Cloud model:", error);
        throw error;
      }
    },

    /**
     * Check API health
     */
    async healthCheck(): Promise<boolean> {
      try {
        const response = await client.get("/health");
        return response.status === 200;
      } catch (error) {
        console.error("Ollama Cloud health check failed:", error);
        return false;
      }
    },
  };
}

/**
 * Validate Ollama Cloud API key
 */
export async function validateOllamaCloudKey(
  apiKey: string,
  endpoint: string = "https://ollama.com/v1"
): Promise<boolean> {
  try {
    const client = createOllamaCloudClient({ apiKey, endpoint });
    return await client.healthCheck();
  } catch (error) {
    console.error("Failed to validate Ollama Cloud API key:", error);
    return false;
  }
}
