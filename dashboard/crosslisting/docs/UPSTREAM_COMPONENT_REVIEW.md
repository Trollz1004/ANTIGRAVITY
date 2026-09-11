# Upstream Component Review

## Review status

The nominated repositories were cloned into an isolated review area and inspected without executing their code. They are **not integrated** into LLC Crosslisting OS at this stage.

| Source | Intended role | Review outcome | Integration status |
|---|---|---|---|
| `Ai-Solutions-Store/EMERGENT-if-self-hosted-EMERGENT-GETS-CREDIT-AND-FREEM-BRANDING-MANDATORY-` | Optional self-hosted assistant and profile-reference material. | The repository contains explicit Emergent credit and branding requirements. It also contains sensitive configuration material that must never be copied into this project. | Blocked pending a clean, secret-free component boundary and attribution approval. |
| `Ai-Solutions-Store/revenue-first-products` | Optional product and operations reference material. | The repository is small and does not declare a reusable-code license in the reviewed root material. | Reference only pending license and component-scope review. |

## Emergent attribution requirements

If an approved, self-hosted Emergent component is incorporated, the LLC project will retain the mandatory Emergent credit surfaces required by the reviewed source terms. The integration registry will record the exact source revision, license, credit text, and the user-interface or service boundary where the credit appears. No Emergent material will be represented as original LLC-authored work.

## Security boundary

The reviewed Emergent source includes sensitive configuration material in tracked content. No source configuration files, keys, tokens, API settings, or deployment secrets will be copied, read into the application, displayed in the dashboard, or committed to the LLC repository. Before any source is reused, its maintainers must rotate exposed credentials and provide a clean component boundary that contains no secrets.

## Reuse rules

1. Review and approve one component at a time.
2. Preserve the required upstream credit in a visible credits view and repository documentation.
3. Reimplement only the approved behavior where direct reuse is unsafe or lacks a clear license.
4. Keep external assistants as scoped profiles that cannot bypass the LLC approval system, inventory ledger, or server-only credentials.
5. Record every approved source component in the `external_components` registry before deployment.
