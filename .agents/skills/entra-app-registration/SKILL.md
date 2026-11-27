---
name: entra-app-registration
description: 'Guides Microsoft Entra ID app registration, OAuth 2.0 authentication, and MSAL integration. USE FOR: create app registration, register Azure AD app, configure OAuth, set up authentication, add API permissions, generate service principal, MSAL example, console app auth, Entra ID setup, Azure AD authentication. DO NOT USE FOR: Azure RBAC or role assignments (use azure-rbac), Key Vault secrets (use azure-keyvault-expiration-audit), Azure resource security (use azure-security).'
---

## Overview

Microsoft Entra ID (formerly Azure Active Directory) is Microsoft's cloud-based identity and access management service. App registrations allow applications to authenticate users and access Azure resources securely.

### Key Concepts

| Concept                     | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| **App Registration**        | Configuration that allows an app to use Microsoft identity platform |
| **Application (Client) ID** | Unique identifier for your application                              |
| **Tenant ID**               | Unique identifier for your Azure AD tenant/directory                |
| **Client Secret**           | Password for the application (confidential clients only)            |
| **Redirect URI**            | URL where authentication responses are sent                         |
| **API Permissions**         | Access scopes your app requests                                     |
| **Service Principal**       | Identity created in your tenant when you register an app            |

### Application Types

| Type                      | Use Case                      |
| ------------------------- | ----------------------------- |
| **Web Application**       | Server-side apps, APIs        |
| **Single Page App (SPA)** | JavaScript/React/Angular apps |
| **Mobile/Native App**     | Desktop, mobile apps          |
| **Daemon/Service**        | Background services, APIs     |

## Core Workflow

### Step 1: Register the Application

Create an app registration in the Azure portal or using Azure CLI.

**Portal Method:**

1. Navigate to Azure Portal → Microsoft Entra ID → App registrations
2. Click "New registration"
3. Provide name, supported account types, and redirect URI
4. Click "Register"

**CLI Method:** See [references/cli-commands.md](references/cli-commands.md)
**IaC Method:** See [references/BICEP-EXAMPLE.bicep](references/BICEP-EXAMPLE.bicep)

It's highly recommended to use the IaC to manage Entra app registration if you already use IaC in your project, need a scalable solution for managing lots of app registrations or need fine-grained audit history of the configuration changes.

### Step 2: Configure Authentication

Set up authentication settings based on your application type.

- **Web Apps**: Add redirect URIs, enable ID tokens if needed
- **SPAs**: Add redirect URIs, enable implicit grant flow if necessary
- **Mobile/Desktop**: Use a custom URI scheme (e.g., `myapp://auth`) or an approved native redirect host per RFC 8252
- **Services**: No redirect URI needed for client credentials flow

### Step 3: Configure API Permissions

Grant your application permission to access Microsoft APIs or your own APIs.

**Common Microsoft Graph Permissions:**

- `User.Read` - Read user profile
- `User.ReadWrite.All` - Read and write all users
- `Directory.Read.All` - Read directory data
- `Mail.Send` - Send mail as a user

**Details:** See [references/api-permissions.md](references/api-permissions.md)

### Step 4: Create Client Credentials (if needed)

For confidential client applications (web apps, services), create a client secret, certificate or federated identity credential.

**Client Secret:**

- Navigate to "Certificates & secrets"
- Create new client secret
- Copy the value immediately (only shown once)
- Store securely (Key Vault recommended)

**Certificate:** For production environments, use certificates instead of secrets for enhanced security. Upload certificate via "Certificates & secrets" section.

**Federated Identity Credential:** For dynamically authenticating the confidential client to Entra platform.

### Step 5: Implement OAuth Flow

Integrate the OAuth flow into your application code.

**See:**

- [references/oauth-flows.md](references/oauth-flows.md) - OAuth 2.0 flow details
- [references/console-app-example.md](references/console-app-example.md) - Console app implementation

## Common Patterns

### Pattern 1: First-Time App Registration

Walk user through their first app registration step-by-step.

**Required Information:**

- Application name
- Application type (web, SPA, mobile, service)
- Redirect URIs (if applicable)
- Required permissions

**Script:** See [references/first-app-registration.md](references/first-app-registration.md)

### Pattern 2: Console Application with User Authentication

Create a .NET/Python/Node.js console app that authenticates users.

**Required Information:**

- Programming language (C#, Python, JavaScript, etc.)
- Authentication library (MSAL recommended)
- Required permissions

**Example:** See [references/console-app-example.md](references/console-app-example.md)

### Pattern 3: Service-to-Service Authentication

Set up daemon/service authentication without user interaction.

**Required Information:**

- Service/app name
- Target API/resource
- Whether to use secret or certificate

**Implementation:** Use Client Credentials flow (see [references/oauth-flows.md#client-credentials-flow](references/oauth-flows.md#client-credentials-flow))

## MCP Tools and CLI

### Azure CLI Commands

| Command                      | Purpose                     |
| ---------------------------- | --------------------------- |
| `az ad app create`           | Create new app registration |
| `az ad app list`             | List app registrations      |
| `az ad app show`             | Show app details            |
| `az ad app permission add`   | Add API permission          |
| `az ad app credential reset` | Generate new client secret  |
| `az ad sp create`            | Create service principal    |

**Complete reference:** See [references/cli-commands.md](references/cli-commands.md)

### Microsoft Authentication Library (MSAL)

MSAL is the recommended library for integrating Microsoft identity platform.

**Supported Languages:**

- .NET/C# - `Microsoft.Identity.Client`
- JavaScript/TypeScript - `@azure/msal-browser`, `@azure/msal-node`
- Python - `msal`

**Examples:** See [references/console-app-example.md](references/console-app-example.md)

## Security Best Practices

| Practice                          | Recommendation                                                  |
| --------------------------------- | --------------------------------------------------------------- |
| **Never hardcode secrets**        | Use environment variables, Azure Key Vault, or managed identity |
| **Rotate secrets regularly**      | Set expiration, automate rotation                               |
| **Use certificates over secrets** | More secure for production                                      |
| **Least privilege permissions**   | Request only required API permissions                           |
| **Enable MFA**                    | Require multi-factor authentication for users                   |
| **Use managed identity**          | For Azure-hosted apps, avoid secrets entirely                   |
| **Validate tokens**               | Always validate issuer, audience, expiration                    |
| **Use HTTPS only**                | All web/SPA redirect URIs must use HTTPS                        |
| **Monitor sign-ins**              | Use Entra ID sign-in logs for anomaly detection                 |

## SDK Quick References

- **Azure Identity**: [Python](references/sdk/azure-identity-py.md) | [.NET](references/sdk/azure-identity-dotnet.md) | [TypeScript](references/sdk/azure-identity-ts.md) | [Java](references/sdk/azure-identity-java.md) | [Rust](references/sdk/azure-identity-rust.md)
- **Key Vault (secrets)**: [Python](references/sdk/azure-keyvault-py.md) | [TypeScript](references/sdk/azure-keyvault-secrets-ts.md)
- **Auth Events**: [.NET](references/sdk/microsoft-azure-webjobs-extensions-authentication-events-dotnet.md)

## References

- [OAuth Flows](references/oauth-flows.md) - Detailed OAuth 2.0 flow explanations
- [CLI Commands](references/cli-commands.md) - Azure CLI reference for app registrations
- [Console App Example](references/console-app-example.md) - Complete working examples
- [First App Registration](references/first-app-registration.md) - Step-by-step guide for beginners
- [API Permissions](references/api-permissions.md) - Understanding and configuring permissions
- [Troubleshooting](references/troubleshooting.md) - Common issues and solutions

## External Resources

- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/entra/identity-platform/)
- [OAuth 2.0 and OpenID Connect protocols](https://learn.microsoft.com/entra/identity-platform/v2-protocols)
- [MSAL Documentation](https://learn.microsoft.com/entra/msal/)
- [Microsoft Graph API](https://learn.microsoft.com/graph/)
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
