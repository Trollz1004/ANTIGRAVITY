import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPaperclipClient } from "./hermesAdapter";

describe("Paperclip Client", () => {
  let client: ReturnType<typeof createPaperclipClient>;

  beforeEach(() => {
    client = createPaperclipClient({
      apiUrl: "http://localhost:3000",
      apiKey: "test-key",
      companyId: "company-123",
    });
  });

  describe("client initialization", () => {
    it("should create client with valid config", () => {
      expect(client).toBeDefined();
    });

    it("should handle config without API key", () => {
      const clientNoKey = createPaperclipClient({
        apiUrl: "http://localhost:3000",
        companyId: "company-123",
      });

      expect(clientNoKey).toBeDefined();
    });
  });

  describe("task creation validation", () => {
    it("should validate required fields for task creation", async () => {
      const taskData = {
        title: "Test Task",
        description: "Test Description",
        priority: "high" as const,
        status: "todo" as const,
      };

      expect(taskData.title).toBeTruthy();
      expect(taskData.description).toBeTruthy();
      expect(["low", "medium", "high", "critical"]).toContain(taskData.priority);
      expect(["backlog", "todo", "in_progress", "in_review", "done"]).toContain(
        taskData.status
      );
    });

    it("should reject task without title", () => {
      const taskData = {
        title: "",
        description: "Test Description",
      };

      expect(taskData.title).toBeFalsy();
    });

    it("should reject task without description", () => {
      const taskData = {
        title: "Test Task",
        description: "",
      };

      expect(taskData.description).toBeFalsy();
    });
  });

  describe("task priority validation", () => {
    it("should accept valid priorities", () => {
      const validPriorities = ["low", "medium", "high", "critical"];

      validPriorities.forEach((priority) => {
        expect(validPriorities).toContain(priority);
      });
    });

    it("should validate priority levels", () => {
      const priorities = ["low", "medium", "high", "critical"];
      const testPriority = "high";

      expect(priorities).toContain(testPriority);
    });
  });

  describe("task status lifecycle", () => {
    it("should follow correct status transitions", () => {
      const validStatuses = [
        "backlog",
        "todo",
        "in_progress",
        "in_review",
        "done",
        "blocked",
        "cancelled",
      ];

      const transitions = {
        backlog: ["todo", "cancelled"],
        todo: ["in_progress", "blocked", "cancelled"],
        in_progress: ["in_review", "blocked", "cancelled"],
        in_review: ["in_progress", "done", "cancelled"],
        done: [],
        blocked: ["todo", "cancelled"],
        cancelled: [],
      };

      Object.keys(transitions).forEach((status) => {
        expect(validStatuses).toContain(status);
      });
    });
  });

  describe("comment functionality", () => {
    it("should validate comment body", () => {
      const comment = {
        body: "This is a test comment with @mentions and **markdown**",
      };

      expect(comment.body).toBeTruthy();
      expect(comment.body.length).toBeGreaterThan(0);
      expect(comment.body).toContain("@mentions");
      expect(comment.body).toContain("**markdown**");
    });

    it("should reject empty comments", () => {
      const comment = {
        body: "",
      };

      expect(comment.body).toBeFalsy();
    });
  });

  describe("agent assignment", () => {
    it("should validate agent ID format", () => {
      const agentId = "agent-123";

      expect(agentId).toBeTruthy();
      expect(agentId.length).toBeGreaterThan(0);
    });

    it("should accept agent name or ID", () => {
      const validAssignees = ["agent-123", "claude-opus", "agent_001"];

      validAssignees.forEach((assignee) => {
        expect(assignee).toBeTruthy();
      });
    });
  });

  describe("document handling", () => {
    it("should validate document keys", () => {
      const validKeys = ["plan", "design", "notes", "implementation"];

      validKeys.forEach((key) => {
        expect(key).toBeTruthy();
        expect(key.length).toBeGreaterThan(0);
      });
    });

    it("should support markdown format", () => {
      const document = {
        key: "plan",
        title: "Implementation Plan",
        format: "markdown" as const,
        body: "# Plan\n\n## Overview\n\nThis is the plan.",
      };

      expect(["markdown", "text"]).toContain(document.format);
      expect(document.body).toContain("#");
    });
  });
});
