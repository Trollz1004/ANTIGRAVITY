# Antigravity Staging Environment

This document outlines the setup and usage of the Antigravity platform's staging environment. The staging environment mirrors the production setup as closely as possible, providing a dedicated space for QA, integration testing, and feature validation before deployment to production.

## 1. How to Start the Staging Environment

To start the staging environment, navigate to the root of the `/mnt/c/ANTIGRAVITY` repository in your terminal (WSL) and run the provided `start-staging.sh` script:

```bash
cd /mnt/c/ANTIGRAVITY
scripts/start-staging.sh
```

**Prerequisites:**
- Docker and Docker Compose must be installed and running.
- You must create a `.env.staging` file in the root of the repository by copying and configuring `.env.staging.example`. This file contains staging-specific environment variables.

The `start-staging.sh` script will:
1. Build the frontend application with staging API configurations.
2. Bring up all Docker services defined in `docker-compose.staging.yml`.
3. Wait for the backend API to become healthy.
4. Report the URLs for accessing the staging services.

## 2. How to Stop the Staging Environment

To stop and remove all services related to the staging environment, run the following command from the repository root:

```bash
cd /mnt/c/ANTIGRAVITY
docker-compose -f docker-compose.staging.yml --env-file .env.staging down
```

This will stop and remove the containers, networks, and volumes created by `docker-compose.staging.yml`.

## 3. Port Mappings

To avoid conflicts with the production environment (if running locally), the staging environment uses distinct ports:

| Service               | Production Port (docker-compose.yml) | Staging Port (docker-compose.staging.yml) |
| :-------------------- | :----------------------------------- | :---------------------------------------- |
| Redis                 | `6379`                               | `6380`                                    |
| Qdrant API            | `6333`                               | `6335`                                    |
| Qdrant HTTP           | `6334`                               | `6336`                                    |
| OpenClaw              | `3200`                               | `3201`                                    |
| PostgreSQL            | `5432`                               | `5433`                                    |
| Backend FastAPI       | `8000` (internal)                    | `8788` (host)                             |
| Frontend Mission Control| `5173` (internal for Vite dev)     | `5174` (host)                             |
| Paperclip             | `3100` (assumed localhost)           | `3100` (assumed localhost)                |

## 4. How it Differs from Production

The staging environment is designed to be as close to production as possible, but with key differences to facilitate testing and prevent interference:

- **Separate Ports:** All services use different host ports.
- **Separate Data Volumes:** Database and other persistent data (e.g., Qdrant data, OpenClaw session data) are stored in dedicated staging directories (`./qdrant-data-staging`, `./postgres-data-staging`) to ensure data isolation.
- **Environment Variables:** The `ENVIRONMENT` variable is set to `staging`. All sensitive API keys and external service configurations should point to staging instances of those services (e.g., `_staging` suffixes in `.env.staging.example`).
- **Frontend API Endpoint:** The frontend is configured to communicate with the staging backend API (`http://localhost:8788/api/v1`).
- **Logs:** Staging logs are directed to `./logs-staging`.

**Important:** While Paperclip itself runs on `localhost:3100` in both production and staging contexts (as per current understanding), the services within the `docker-compose.staging.yml` stack communicate internally with each other using their service names (e.g., `redis-staging`, `backend-fastapi-staging`).

## 5. How to Run QA Tests Against Staging

1.  **Start the Staging Environment:** Follow the steps in section 1.
2.  **Access Services:**
    *   **Frontend:** Open your browser to `http://localhost:5174`
    *   **Backend API:** Use a tool like Postman, Insomnia, or `curl` to interact with `http://localhost:8788/api/v1`.
    *   **Qdrant UI:** Access the Qdrant administration interface at `http://localhost:6336`.
3.  **Use Staging Data:** Ensure your QA tests are designed to operate with the isolated data volumes of the staging environment. Do not use production data or credentials.
4.  **Monitor Logs:** Check the `./logs-staging` directory for any service logs or errors during testing. You can also view live logs using `docker-compose -f docker-compose.staging.yml --env-file .env.staging logs -f`.
5.  **Test Paperclip Integrations:** If Paperclip interacts with the Antigravity backend, ensure its configuration (e.g., webhooks, API endpoints) points to the staging backend at `http://localhost:8788/api/v1`.
