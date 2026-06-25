# ADR-006: WebSocket authentication via query parameter tokens

## Status
Accepted

## Context
The ANTIGRAVITY project utilizes WebSockets for real-time communication, which requires a secure and efficient method for authenticating clients. Traditional HTTP header-based authentication is not directly applicable to WebSocket handshake requests after the initial connection, and alternatives like cookie-based authentication can introduce complexities, especially across different domains or with modern SPA architectures. A streamlined approach for validating user identity during WebSocket connection establishment is needed.

## Decision
WebSocket authentication is implemented by passing a JWT (JSON Web Token) as a query parameter (`?token=...`) during the WebSocket connection handshake. This token is then extracted and decoded on the server-side (`app.dependencies.websocket_auth.py`). The `sub` claim from the decoded token, representing the user ID, is used to retrieve and validate the user's active status against the database. If the token is invalid, missing, or the user is inactive, a `WebSocketException` is raised.

## Consequences
- **Positive:**
    - Simplicity in implementation and integration with existing JWT authentication mechanisms.
    - Compatible with various WebSocket client libraries and browser APIs.
    - Avoids complexities of managing cookies or custom headers for WebSocket-specific authentication.
    - Leverages existing token decoding and user validation logic.
- **Negative:**
    - Security concern: Tokens in query parameters can be logged by proxies, servers, or browsers, potentially exposing them in URLs. While WebSockets are upgraded from HTTP, the initial handshake URL can still be recorded.
    - Requires careful handling on the client-side to ensure tokens are not inadvertently exposed or persistently stored in insecure locations.
    - Limited to initial connection authentication; re-authentication or token refreshing during an active WebSocket session would require a different mechanism or re-establishing the connection.