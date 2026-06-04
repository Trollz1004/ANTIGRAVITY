# ADR-008: Use of Paperclip for project management

## Status
Accepted

## Context
The ANTIGRAVITY project involves multiple AI agents, diverse tooling, and a complex ecosystem of services. Managing the interaction, routing, and invocation of these components, especially across different execution environments (local, remote), requires a centralized and extensible management plane. Traditional scripting or ad-hoc invocation methods become unwieldy and prone to inconsistencies.

## Decision
Paperclip has been adopted as the project's Multi-Control-Plane (MCP) for internal project management, particularly concerning AI services and tooling orchestration. The `paperclip-mcp/server.py` component acts as a central hub, exposing `paperclip-adapters` (interactive agent launchers) and the local LiteLLM gateway as MCP tools. This allows for standardized listing, launching, and routing between various AI backends and internal tools, all anchored to the `C:\ANTIGRAVITY` workspace. It also includes an upstream citation registry for tracking usage of these services.

## Consequences
- **Positive:**
    - Centralized management and orchestration of diverse AI agents and internal tools.
    - Provides a consistent interface for interacting with different backends, simplifying complex workflows.
    - Enhances auditability and tracking of tool usage through the upstream citation registry.
    - Promotes modularity and extensibility by allowing new adapters and tools to be integrated easily.
    - Anchors operations to the `C:\ANTIGRAVITY` workspace, ensuring consistency in command execution.
- **Negative:**
    - Introduces an additional layer of abstraction and a new dependency (Paperclip MCP).
    - Requires familiarity with Paperclip's concepts and its `FastMCP` framework.
    - Relies on specific environment variables (e.g., `ANTIGRAVITY_ROOT`, `LITELLM_BASE_URL`) for configuration.
    - The self-hosted nature of the citation registry means it's not universally replicated across all Paperclip deployments (e.g., Cloudflare Worker).