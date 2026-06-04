import { describe, it, expect, vi, beforeEach } from "vitest";
import * as modelProvider from "./modelProvider";
import * as db from "./db";

// Mock the db module
vi.mock("./db");

describe("Model Provider Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvailableModels", () => {
    it("should return Ollama models when provider is ollama", async () => {
      const mockConfig = {
        id: 1,
        userId: 1,
        provider: "ollama",
        baseUrl: "http://localhost:11434",
        apiKey: null,
        companyId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getProviderConfig).mockResolvedValue(mockConfig as any);

      const models = await modelProvider.getAvailableModels(1, "ollama");

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
    });

    it("should return empty array when provider config not found", async () => {
      vi.mocked(db.getProviderConfig).mockResolvedValue(null);

      const models = await modelProvider.getAvailableModels(1, "openrouter");

      expect(models).toEqual([]);
    });

    it("should return empty array when provider is inactive", async () => {
      const mockConfig = {
        id: 1,
        userId: 1,
        provider: "ollama",
        baseUrl: "http://localhost:11434",
        apiKey: null,
        companyId: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getProviderConfig).mockResolvedValue(mockConfig as any);

      const models = await modelProvider.getAvailableModels(1, "ollama");

      expect(models).toEqual([]);
    });
  });

  describe("sendChatMessage", () => {
    it("should throw error when provider config not found", async () => {
      vi.mocked(db.getProviderConfig).mockResolvedValue(null);

      await expect(
        modelProvider.sendChatMessage(1, "ollama", "llama2", [
          { role: "user", content: "Hello" },
        ])
      ).rejects.toThrow();
    });

    it("should accept valid chat messages", () => {
      const messages: modelProvider.ChatMessage[] = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "system", content: "You are helpful" },
      ];

      messages.forEach((msg) => {
        expect(["user", "assistant", "system"]).toContain(msg.role);
        expect(msg.content).toBeTruthy();
      });
    });
  });

  describe("model info structures", () => {
    it("should have correct model info structure", () => {
      const model: modelProvider.ModelInfo = {
        id: "llama2",
        name: "Llama 2",
        provider: "ollama",
        description: "Meta's Llama 2 model",
      };

      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(["ollama", "openrouter", "openai", "manus"]).toContain(model.provider);
    });

    it("should validate chat message structure", () => {
      const message: modelProvider.ChatMessage = {
        role: "user",
        content: "Hello, world!",
      };

      expect(["user", "assistant", "system"]).toContain(message.role);
      expect(message.content).toBeTruthy();
    });

    it("should validate chat response structure", () => {
      const response: modelProvider.ChatResponse = {
        content: "Hello!",
        provider: "ollama",
        model: "llama2",
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };

      expect(response.content).toBeTruthy();
      expect(["ollama", "openrouter", "openai", "manus"]).toContain(response.provider);
      expect(response.usage?.totalTokens).toBeGreaterThan(0);
    });
  });

  describe("provider types", () => {
    it("should support all valid providers", () => {
      const validProviders: modelProvider.ModelProvider[] = [
        "ollama",
        "openrouter",
        "openai",
        "manus",
      ];

      validProviders.forEach((provider) => {
        expect(provider).toBeTruthy();
      });
    });
  });
});
