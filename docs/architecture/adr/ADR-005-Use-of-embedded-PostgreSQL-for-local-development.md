# ADR-005: Use of embedded PostgreSQL for local development

## Status
Accepted

## Context
Local development of the ANTIGRAVITY project requires a PostgreSQL database instance that is easy to set up, consistent with the production environment, and isolated from the host system. Manually installing and managing PostgreSQL can be cumbersome and lead to environment inconsistencies between developers.

## Decision
For local development, an embedded PostgreSQL instance managed by Docker Compose is used. The `docker-compose.yml` file within the `backend/fastapi-app/` directory defines a `postgres` service using the `postgres:16-alpine` image. This setup provides a lightweight, consistent, and easily reproducible PostgreSQL environment for all developers, ensuring that local development closely mirrors production deployments.

## Consequences
- **Positive:**
    - Simplified local development setup, reducing onboarding time for new developers.
    - Consistency between development and production database environments, minimizing "it works on my machine" issues.
    - Database state can be easily reset or managed using Docker Compose commands.
    - Isolated database environment prevents conflicts with other local PostgreSQL installations.
    - Lightweight `alpine` image reduces resource consumption.
- **Negative:**
    - Requires Docker to be installed and running on the development machine.
    - Developers need basic familiarity with Docker and Docker Compose.
    - Performance might not be identical to a dedicated production database server, though sufficient for local development.