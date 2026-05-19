# ANTIGRAVITY Platform — Scaling Guide

> **OPU-62** — Auto-scaling rules and deployment templates  
> Last updated: 2026-05-18

---

## Table of Contents

1. [Overview](#overview)
2. [Horizontal vs Vertical Scaling](#horizontal-vs-vertical-scaling)
3. [Scaling Thresholds](#scaling-thresholds)
4. [Service-Level Scaling Policies](#service-level-scaling-policies)
5. [Database Connection Pooling](#database-connection-pooling)
6. [CDN & Static Asset Caching](#cdn--static-asset-caching)
7. [Load Balancing Recommendations](#load-balancing-recommendations)
8. [Production Docker Compose Template](#production-docker-compose-template)
9. [Scaling Rules Reference (JSON)](#scaling-rules-reference-json)

---

## Overview

The ANTIGRAVITY platform is composed of multiple services — web frontend, API backend, background workers, and supporting infrastructure (LLM routing, monitoring, etc.). This document defines the auto-scaling strategy, thresholds, and deployment templates for production environments.

**Key principles:**
- Scale horizontally for stateless services (web, api, worker).
- Scale vertically only for stateful components (databases, caches).
- Use health-check-driven orchestration to ensure zero-downtime deployments.
- Define cooldown periods to prevent scaling thrashing.

---

## Horizontal vs Vertical Scaling

### Horizontal Scaling (Scale Out / In)

**Applicable to:** `web`, `api`, `worker` services (stateless).

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **Add replicas** | CPU > 70%, Memory > 80%, or request rate > 1000 rps per instance | Linear capacity increase, fault tolerance | Requires load balancer, session handling |
| **Remove replicas** | CPU < 30% and request rate < 200 rps per instance for 5+ min | Cost reduction | Brief capacity reduction during scale-in |

**Recommended tooling:**
- Docker Swarm or Kubernetes `HorizontalPodAutoscaler` (HPA)
- Cloud provider auto-scaling groups (AWS ASG, GCP MIG, Azure VMSS)

### Vertical Scaling (Scale Up / Down)

**Applicable to:** `database`, `cache`, `message-queue` (stateful).

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **Increase CPU/RAM** | Sustained high utilization, cannot shard further | No application changes needed | Downtime for resize (usually), cost spike |
| **Increase disk I/O** | Database write/read latency > 100ms p95 | Improves query performance | Storage cost, backup window growth |

**Recommendation:** Prefer vertical scaling only after horizontal scaling limits are reached. Use read replicas for database read scaling.

---

## Scaling Thresholds

### CPU Thresholds

| Metric | Scale Up | Scale Down | Notes |
|--------|----------|------------|-------|
| CPU utilization (avg across replicas) | **> 70%** for 2 consecutive minutes | **< 30%** for 5 consecutive minutes | Measured per-container |
| CPU utilization (peak single replica) | **> 85%** for 1 minute | — | Emergency scale-up trigger |

### Memory Thresholds

| Metric | Scale Up | Scale Down | Notes |
|--------|----------|------------|-------|
| Memory utilization | **> 80%** for 2 consecutive minutes | **< 40%** for 10 minutes | Memory scale-down is conservative to avoid OOM |
| Swap usage | **> 10%** at any time | — | Indicates memory pressure; immediate scale-up |

### Request Rate Thresholds

| Metric | Scale Up | Scale Down | Notes |
|--------|----------|------------|-------|
| Requests per second (per replica) | **> 1000 rps** for 2 min | **< 200 rps** for 5 min | Based on ALB/NGINX metrics |
| P95 latency | **> 500ms** for 2 min | **< 100ms** for 5 min | Latency-based scaling for user-facing services |
| Error rate (5xx) | **> 2%** for 1 min | — | Emergency scale-up + alert |

### Cooldown Periods

| Action | Cooldown |
|--------|----------|
| Scale up (CPU/Memory) | **120 seconds** before next scale-up |
| Scale down (CPU/Memory) | **300 seconds** before next scale-down |
| Scale up (Request rate) | **180 seconds** before next scale-up |
| Scale down (Request rate) | **600 seconds** before next scale-down |
| Emergency scale-up | **60 seconds** (shorter cooldown for critical situations) |

---

## Service-Level Scaling Policies

### Web Service (React Frontend)

- **Min replicas:** 2
- **Max replicas:** 10
- **Scale trigger:** CPU > 70% or request rate > 800 rps
- **Notes:** Served via CDN in production; scaling primarily handles SSR or API proxy traffic.

### API Service (FastAPI Backend)

- **Min replicas:** 2
- **Max replicas:** 20
- **Scale trigger:** CPU > 70%, Memory > 80%, or P95 latency > 500ms
- **Notes:** Stateless; safe to scale horizontally. Ensure DB connection pool limits are respected (see below).

### Worker Service (Background Jobs)

- **Min replicas:** 1
- **Max replicas:** 10
- **Scale trigger:** Queue depth > 1000 messages or processing lag > 60 seconds
- **Notes:** Scale based on queue metrics, not CPU. Workers are I/O-bound.

### LLM Router (LiteLLM)

- **Min replicas:** 1
- **Max replicas:** 5
- **Scale trigger:** Request rate > 500 rps or P95 latency > 2000ms
- **Notes:** LLM inference is expensive; use request batching and caching before scaling.

---

## Database Connection Pooling

### Problem

Each API replica opens its own pool of database connections. With 20 API replicas and a pool size of 20, that's **400 concurrent connections** — exceeding PostgreSQL's default `max_connections` of 100.

### Solution: PgBouncer (Connection Pooler)

Deploy PgBouncer as a sidecar or standalone service between the API layer and PostgreSQL:

```
API replicas → PgBouncer (transaction mode) → PostgreSQL
```

### Configuration Guidelines

| Parameter | Value | Notes |
|-----------|-------|-------|
| `max_client_conn` | 1000 | Total client connections PgBouncer accepts |
| `default_pool_size` | 20 | Connections per database/user pair |
| `min_pool_size` | 5 | Keep warm connections ready |
| `reserve_pool_size` | 5 | Overflow connections for bursts |
| `server_idle_timeout` | 300 | Close idle server connections after 5 min |
| `query_timeout` | 30 | Kill queries exceeding 30s |

### Per-Replica Pool Sizing

```
max_db_connections = (PgBouncer_pool_size) / (number_of_api_replicas)

Example: 20 pool size / 5 replicas = 4 connections per replica
```

**Rule of thumb:** Set `pool_size` in the application to `ceil(default_pool_size / min_replicas)` to ensure enough connections at minimum scale, but not so many that max replicas overwhelm the database.

---

## CDN & Static Asset Caching

### Recommendation: Cloudflare CDN

The ANTIGRAVITY frontend is already deployed on Cloudflare Pages. For production API and static asset caching:

### Cache Rules

| Asset Type | Cache TTL | Cache Key | Notes |
|------------|-----------|-----------|-------|
| Static assets (JS, CSS, images) | **1 year** | URL + version hash | Use fingerprinted filenames |
| API responses (GET) | **60 seconds** | URL + Authorization scope | Short TTL for dynamic data |
| API responses (public) | **300 seconds** | URL | Longer TTL for public endpoints |
| LLM responses | **0 seconds** (no cache) | — | Never cache LLM output by default |

### Cache Invalidation Strategy

1. **Versioned assets:** Use content hashes in filenames (`app.a1b2c3.js`). No invalidation needed — new deploys get new URLs.
2. **API cache:** Use `Cache-Control: max-age=N, stale-while-revalidate=60` headers.
3. **Purge on deploy:** Trigger Cloudflare cache purge via API on frontend deployment.

### Static Asset Optimization

- Enable Brotli compression on Cloudflare.
- Set `immutable` cache directive for versioned assets.
- Use `ETag` headers for conditional requests.
- Serve images in WebP/AVIF formats with fallbacks.

---

## Load Balancing Recommendations

### Layer 7 (Application) Load Balancer

**Recommended:** AWS ALB, GCP Cloud Load Balancing, or NGINX.

### Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Algorithm | **Least connections** | Better than round-robin for variable-latency workloads |
| Health check path | `/health` | Must return 200 OK within 5 seconds |
| Health check interval | **10 seconds** | |
| Healthy threshold | **2 consecutive successes** | |
| Unhealthy threshold | **3 consecutive failures** | |
| Deregistration delay | **30 seconds** | Allow in-flight requests to complete |
| Sticky sessions | **Disabled** | Services are stateless; sticky sessions reduce distribution |
| Idle timeout | **60 seconds** | Match with keep-alive settings |
| SSL termination | **At the LB** | Offload TLS from application containers |

### NGINX Alternative (Self-Hosted)

```nginx
upstream api_backend {
    least_conn;
    server api-1:8000 max_fails=3 fail_timeout=30s;
    server api-2:8000 max_fails=3 fail_timeout=30s;
    server api-3:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl;
    server_name api.antigravity.local;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

### Multi-Region Considerations

For multi-region deployments:
- Use DNS-based global load balancing (Cloudflare Load Balancing, AWS Route 53 latency routing).
- Deploy read replicas in each region.
- Use a global database (CockroachDB, PlanetScale) or async replication between regions.

---

## Production Docker Compose Template

See [`docker-compose.prod.yml`](../docker-compose.prod.yml) in the repository root for the production deployment template. It includes:

- Service definitions for `web`, `api`, `worker`
- Resource limits and reservations per service
- Health checks with appropriate intervals
- Replica counts (compatible with Docker Swarm `deploy.replicas`)
- Logging and restart policies

---

## Scaling Rules Reference (JSON)

See [`infrastructure/scaling-rules.json`](../infrastructure/scaling-rules.json) for the machine-readable scaling rules consumed by monitoring and orchestration tooling.

---

## Appendix: Monitoring & Alerting Integration

Scaling rules are enforced by the monitoring stack:

- **Prometheus** scrapes container metrics (CPU, memory, request rates).
- **Alertmanager** fires scaling alerts when thresholds are breached.
- **Custom autoscaler** (or cloud provider HPA) consumes scaling rules JSON to make scaling decisions.

### Key Prometheus Queries

```promql
# CPU utilization per container
100 - (avg by (container_name) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory utilization per container
(container_memory_usage_bytes / container_spec_memory_bytes) * 100

# Request rate per service
rate(http_requests_total{service="api"}[2m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="api"}[5m]))
```

---

*This document is maintained by the ANTIGRAVITY infrastructure team. For questions or updates, open an issue in the repository.*
