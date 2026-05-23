# Monitoring and Alerting for ANTIGRAVITY Platform

This document outlines the monitoring and alerting setup for the ANTIGRAVITY platform, utilizing Prometheus for metrics collection, Grafana for visualization, and Alertmanager for alert routing.

## Architecture Overview

The monitoring stack is deployed using Docker Compose and consists of the following components:

- **Prometheus**: A time-series database that collects metrics from the FastAPI backend (and optionally `node-exporter` for host-level metrics). It also evaluates alerting rules.
  - **Port**: 9090
- **Grafana**: A visualization tool that queries Prometheus for data and displays it on interactive dashboards.
  - **Port**: 3000
  - **Default Credentials**: `admin`/`antigravity`
- **Alertmanager**: Handles alerts sent by Prometheus, deduping, grouping, and routing them to the appropriate receivers (e.g., webhooks, PagerDuty).
  - **Port**: 9093
- **Node Exporter**: (Optional) Exposes a wide range of hardware and OS metrics for Linux hosts. Integrated into `docker-compose.yml` for easy deployment.
  - **Port**: 9100

The FastAPI backend exposes its Prometheus metrics on the `/metrics` endpoint.

## How to Start the Monitoring Stack

To start the entire monitoring stack, navigate to the `monitoring/` directory and run Docker Compose:

```bash
cd /mnt/c/ANTIGRAVITY/monitoring
docker compose up -d
```

This will start Prometheus, Grafana, Alertmanager, and Node Exporter in detached mode.

To stop the stack:

```bash
cd /mnt/c/ANTIGRAVITY/monitoring
docker compose down
```

## SLO Definitions

The following Service Level Objectives (SLOs) are monitored for the ANTIGRAVITY platform backend:

- **Availability SLO**: 99.9% of requests returning 2xx or 3xx status codes over a 30-day window.
  - **Alerting Threshold**: Availability below 99.9% (warning), below 99% (critical).
- **Latency SLO**: P95 (95th percentile) request latency should be less than 200ms.
  - **Alerting Threshold**: P95 latency > 200ms (warning), > 500ms (critical).

## Alert Routing

Alerts are configured in `monitoring/alerts/slo-rules.yml` and routed by `Alertmanager` (`monitoring/alertmanager.yml`).

- **Default Receiver**: `default-receiver` (webhook to `http://backend:8000/api/v1/alerts/webhook`)
- **Critical Alerts**: `critical-receiver` (webhook to `http://backend:8000/api/v1/alerts/webhook`)
- **Warning Alerts**: `warning-receiver` (webhook to `http://backend:8000/api/v1/alerts/webhook`)

PagerDuty integration can be enabled by uncommenting and configuring the `pagerduty_configs` section in `alertmanager.yml`.

## Dashboard Descriptions

Grafana dashboards are provisioned from `monitoring/grafana/dashboards/fastapi-dashboard.json`. The key panels include:

- **Request Rate (by method)**: Shows the rate of HTTP requests per second, broken down by HTTP method.
- **Error Rate (5xx %)**: Displays the percentage of 5xx errors out of total requests.
- **Availability (2xx+3xx %)**: Shows the percentage of successful requests (2xx/3xx) out of total requests.
- **Latency Percentiles (p50, p95, p99)**: Visualizes the 50th, 95th, and 99th percentile of request durations.
- **In-Flight Requests**: A gauge showing the number of currently active, unprocessed requests.
- **Request Rate by Status Code**: Breaks down the request rate by HTTP status code, providing insight into response types.