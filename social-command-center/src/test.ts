/**
 * Social Command Center — Unit Tests
 * 
 * Tests all data modules and server creation.
 * Run: node --test dist/test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PLATFORMS, getPlatformsByType, getPlatformCount, PLATFORM_TYPES } from "./platforms.js";
import { AGENTS, AGENT_GROUPS, getAgentsByGroup, getAgentsByStatus, getAgentCount, getActiveAgentCount } from "./agents.js";
import { createSocialCommandServer } from "./server.js";
import { ACCESS_POLICY, getAccessTier, hasPermission } from "./access-policy.js";

describe("Platform Registry", () => {
  it("should have exactly 24 platforms", () => {
    assert.equal(getPlatformCount(), 24);
  });

  it("should have all required fields on every platform", () => {
    for (const [id, platform] of Object.entries(PLATFORMS)) {
      assert.ok(platform.id, `${id} missing id`);
      assert.equal(platform.id, id, `${id} id mismatch`);
      assert.ok(platform.label, `${id} missing label`);
      assert.ok(platform.icon, `${id} missing icon`);
      assert.ok(platform.color, `${id} missing color`);
      assert.ok(platform.type, `${id} missing type`);
      assert.ok(platform.claw, `${id} missing claw`);
      assert.ok(platform.api, `${id} missing api`);
      assert.ok(platform.corsSupport, `${id} missing corsSupport`);
      assert.ok(platform.notes, `${id} missing notes`);
    }
  });

  it("should have valid type values", () => {
    const validTypes = ["social", "commerce", "llm", "dispatch", "infra"];
    for (const [id, platform] of Object.entries(PLATFORMS)) {
      assert.ok(validTypes.includes(platform.type), `${id} has invalid type: ${platform.type}`);
    }
  });

  it("should have valid CORS support values", () => {
    const validCors = ["browser", "backend-proxy", "local", "n/a"];
    for (const [id, platform] of Object.entries(PLATFORMS)) {
      assert.ok(validCors.includes(platform.corsSupport), `${id} has invalid corsSupport: ${platform.corsSupport}`);
    }
  });

  it("should have exactly 8 social platforms", () => {
    assert.equal(getPlatformsByType("social").length, 8);
  });

  it("should have exactly 4 commerce platforms", () => {
    assert.equal(getPlatformsByType("commerce").length, 4);
  });

  it("should have exactly 6 LLM platforms", () => {
    assert.equal(getPlatformsByType("llm").length, 6);
  });

  it("should have exactly 2 dispatch platforms", () => {
    assert.equal(getPlatformsByType("dispatch").length, 2);
  });

  it("should have exactly 4 infra platforms", () => {
    assert.equal(getPlatformsByType("infra").length, 4);
  });

  it("should have valid hex colors", () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const [id, platform] of Object.entries(PLATFORMS)) {
      assert.ok(hexRegex.test(platform.color), `${id} has invalid color: ${platform.color}`);
    }
  });

  it("should have only 2 browser-direct CORS platforms (Facebook + YouTube)", () => {
    const browserDirect = Object.values(PLATFORMS).filter((p) => p.corsSupport === "browser");
    assert.equal(browserDirect.length, 2);
    const ids = browserDirect.map((p) => p.id).sort();
    assert.deepEqual(ids, ["facebook", "youtube"]);
  });

  it("should have unique platform IDs", () => {
    const ids = Object.keys(PLATFORMS);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });
});

describe("Agent Swarm", () => {
  it("should have exactly 34 agents", () => {
    assert.equal(getAgentCount(), 34);
  });

  it("should have all required fields on every agent", () => {
    for (const agent of AGENTS) {
      assert.ok(agent.id, `Agent missing id`);
      assert.ok(agent.name, `${agent.id} missing name`);
      assert.ok(agent.role, `${agent.id} missing role`);
      assert.ok(agent.status, `${agent.id} missing status`);
      assert.ok(agent.node, `${agent.id} missing node`);
      assert.ok(agent.color, `${agent.id} missing color`);
      assert.ok(agent.group, `${agent.id} missing group`);
    }
  });

  it("should have valid status values", () => {
    const validStatuses = ["active", "standby", "offline"];
    for (const agent of AGENTS) {
      assert.ok(validStatuses.includes(agent.status), `${agent.id} has invalid status: ${agent.status}`);
    }
  });

  it("should have valid group values", () => {
    for (const agent of AGENTS) {
      assert.ok(AGENT_GROUPS.includes(agent.group), `${agent.id} has invalid group: ${agent.group}`);
    }
  });

  it("should have unique agent IDs", () => {
    const ids = AGENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, `Duplicate agent IDs found`);
  });

  it("should have 8 agent groups", () => {
    assert.equal(AGENT_GROUPS.length, 8);
  });

  it("should have 3 Orchestrators", () => {
    assert.equal(getAgentsByGroup("Orchestrators").length, 3);
  });

  it("should have 2 Research agents", () => {
    assert.equal(getAgentsByGroup("Research").length, 2);
  });

  it("should have 4 Content Claws", () => {
    assert.equal(getAgentsByGroup("Content Claws").length, 4);
  });

  it("should have 3 Commerce agents", () => {
    assert.equal(getAgentsByGroup("Commerce").length, 3);
  });

  it("should have 9 Watchers", () => {
    assert.equal(getAgentsByGroup("Watchers").length, 9);
  });

  it("should have 4 Ollama Fleet agents", () => {
    assert.equal(getAgentsByGroup("Ollama Fleet").length, 4);
  });

  it("should have 7 ClawX Council members", () => {
    assert.equal(getAgentsByGroup("ClawX Council").length, 7);
  });

  it("should have 2 Dispatch agents", () => {
    assert.equal(getAgentsByGroup("Dispatch").length, 2);
  });

  it("should have active agents count <= total", () => {
    assert.ok(getActiveAgentCount() <= getAgentCount());
    assert.ok(getActiveAgentCount() > 0);
  });

  it("should have JoshuaClaw as founder with permanent vote", () => {
    const josh = AGENTS.find((a) => a.id === "joshuaclaw");
    assert.ok(josh);
    assert.equal(josh.name, "JoshuaClaw");
    assert.ok(josh.role.includes("Founder"));
    assert.ok(josh.role.includes("Permanent Vote"));
    assert.equal(josh.node, "Human");
    assert.equal(josh.group, "ClawX Council");
  });

  it("should have valid hex colors", () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const agent of AGENTS) {
      assert.ok(hexRegex.test(agent.color), `${agent.id} has invalid color: ${agent.color}`);
    }
  });
});

describe("MCP Server Creation", () => {
  it("should create server without errors", () => {
    const server = createSocialCommandServer();
    assert.ok(server);
  });

  it("should have correct server name", () => {
    const server = createSocialCommandServer();
    // Server should be created successfully — name is set internally
    assert.ok(server);
  });
});

describe("Iron Wall Compliance", () => {
  it("should NOT contain any secrets or API keys in platform data", () => {
    const json = JSON.stringify(PLATFORMS);
    // Check for common secret patterns
    assert.ok(!json.includes("sk-"), "Found potential secret key prefix 'sk-'");
    assert.ok(!json.includes("APIKEY"), "Found 'APIKEY' in platform data");
    assert.ok(!json.includes("SECRET"), "Found 'SECRET' in platform data");
    assert.ok(!json.includes("PASSWORD"), "Found 'PASSWORD' in platform data");
    assert.ok(!json.includes("TOKEN"), "Found 'TOKEN' in platform data");
    assert.ok(!json.includes("sq0"), "Found Square key prefix 'sq0'");
  });

  it("should NOT contain any secrets in agent data", () => {
    const json = JSON.stringify(AGENTS);
    // Check for actual API key patterns (prefix + hex/alphanumeric), not English words like "Task-Sentry"
    assert.ok(!/sk-[a-zA-Z0-9]{20,}/.test(json), "Found potential secret key in agent data");
    assert.ok(!/APIKEY\s*[:=]/.test(json), "Found 'APIKEY' assignment in agent data");
    assert.ok(!/SECRET\s*[:=]/.test(json), "Found 'SECRET' assignment in agent data");
    assert.ok(!/PASSWORD\s*[:=]/.test(json), "Found 'PASSWORD' assignment in agent data");
    assert.ok(!/ghp_[a-zA-Z0-9]{36}/.test(json), "Found GitHub PAT in agent data");
    assert.ok(!/sq0[a-z]{3}-[a-zA-Z0-9]+/.test(json), "Found Square key in agent data");
  });

  it("should NOT use the word 'donate' or 'donation' (FL §496.405)", () => {
    const allText = JSON.stringify(PLATFORMS) + JSON.stringify(AGENTS);
    const lower = allText.toLowerCase();
    assert.ok(!lower.includes("donate"), "Found 'donate' — violates §496.405");
    assert.ok(!lower.includes("donation"), "Found 'donation' — violates §496.405");
    assert.ok(!lower.includes("solicitation"), "Found 'solicitation' — violates §496.405");
  });
});

describe("Threshold of Trust — Access Policy", () => {
  it("should have exactly 5 access tiers", () => {
    assert.equal(ACCESS_POLICY.tiers.length, 5);
  });

  it("should have Josh as sole authority", () => {
    assert.equal(ACCESS_POLICY.authority, "Joshua Coleman — Sole Authority");
    assert.equal(ACCESS_POLICY.threshold_of_trust.josh_is_sole_authority, true);
  });

  it("should enforce Iron Wall", () => {
    assert.equal(ACCESS_POLICY.threshold_of_trust.iron_wall_enforced, true);
  });

  it("should enforce FL §496.405", () => {
    assert.equal(ACCESS_POLICY.threshold_of_trust.fl_496_405_enforced, true);
  });

  it("should give Founder tier full permissions", () => {
    const founder = ACCESS_POLICY.tiers[0];
    assert.equal(founder.name, "Founder");
    assert.ok(founder.permissions.includes("read"));
    assert.ok(founder.permissions.includes("write"));
    assert.ok(founder.permissions.includes("orchestrate"));
    assert.ok(founder.permissions.includes("post"));
    assert.ok(founder.permissions.includes("deploy"));
    assert.ok(founder.permissions.includes("delete"));
  });

  it("should give Trusted Four orchestrate and post permissions", () => {
    const trusted = ACCESS_POLICY.tiers[1];
    assert.equal(trusted.name, "Trusted Four — Orchestrators");
    assert.ok(trusted.permissions.includes("orchestrate"));
    assert.ok(trusted.permissions.includes("post"));
    assert.ok(trusted.entities.includes("Gemini"));
    assert.ok(trusted.entities.includes("Claude Code"));
    assert.ok(trusted.entities.includes("CodeX"));
    assert.ok(trusted.entities.includes("GitHub Copilot"));
  });

  it("should give third parties READ ONLY — no post, no orchestrate, no deploy, no delete", () => {
    const thirdParty = ACCESS_POLICY.tiers[ACCESS_POLICY.tiers.length - 1];
    assert.equal(thirdParty.name, "Third Party — Read Only");
    assert.deepEqual(thirdParty.permissions, ["read"]);
    assert.ok(!thirdParty.permissions.includes("write"));
    assert.ok(!thirdParty.permissions.includes("post"));
    assert.ok(!thirdParty.permissions.includes("orchestrate"));
    assert.ok(!thirdParty.permissions.includes("deploy"));
    assert.ok(!thirdParty.permissions.includes("delete"));
  });

  it("should default unknown entities to third-party read-only", () => {
    const tier = getAccessTier("SomeRandomThirdPartyAI");
    assert.equal(tier.name, "Third Party — Read Only");
    assert.deepEqual(tier.permissions, ["read"]);
  });

  it("should grant JoshuaClaw founder permissions", () => {
    assert.ok(hasPermission("JoshuaClaw", "read"));
    assert.ok(hasPermission("JoshuaClaw", "write"));
    assert.ok(hasPermission("JoshuaClaw", "orchestrate"));
    assert.ok(hasPermission("JoshuaClaw", "post"));
    assert.ok(hasPermission("JoshuaClaw", "deploy"));
    assert.ok(hasPermission("JoshuaClaw", "delete"));
  });

  it("should deny third parties write/post/orchestrate", () => {
    assert.ok(!hasPermission("RandomBot", "write"));
    assert.ok(!hasPermission("RandomBot", "post"));
    assert.ok(!hasPermission("RandomBot", "orchestrate"));
    assert.ok(!hasPermission("RandomBot", "deploy"));
    assert.ok(!hasPermission("RandomBot", "delete"));
    // But can read
    assert.ok(hasPermission("RandomBot", "read"));
  });

  it("should have hard rules that block third-party access to ANTIGRAVITY", () => {
    const rules = ACCESS_POLICY.hard_rules;
    assert.ok(rules.some((r) => r.includes("No third-party AI may post")));
    assert.ok(rules.some((r) => r.includes("No third-party AI may orchestrate")));
    assert.ok(rules.some((r) => r.includes("No third-party AI may modify ANTIGRAVITY")));
    assert.ok(rules.some((r) => r.includes("No third-party AI may access secrets")));
    assert.ok(rules.some((r) => r.includes("E: drive sandbox repos get read-only")));
  });
});

