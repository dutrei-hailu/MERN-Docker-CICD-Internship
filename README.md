# MERN Stack - Docker Compose with Production Infrastructure

A full-stack MERN (MongoDB, Express, React, Node.js) application with production-ready infrastructure including Nginx reverse proxy, load balancing, Prometheus monitoring, and Grafana dashboards.

## Architecture Overview

```
                         ┌──────────────────────────────────────────────────┐
                         │                  Docker Network                  │
                         │                  (mern_network)                  │
                         │                                                  │
   :80 ──────────► ┌─────────────┐                                         │
   (host)          │    Nginx    │──── load balance ────► ┌───────────────┐ │
                   │  (reverse   │     (round-robin)      │ backend-1:5050│ │
                   │   proxy)    │                        └───────┬───────┘ │
                   │             │                        ┌───────┴───────┐ │
                   │             │──── frontend ─────────►│ backend-2:5050│ │
                   │             │     proxy              └───────┬───────┘ │
                   └──────┬──────┘                                │         │
                          │                                 ┌─────▼─────┐   │
                          │                                 │ mongodb   │   │
                   ┌──────▼──────┐                          │  :27017   │   │
                   │  frontend   │                          └───────────┘   │
                   │   -prod:80  │                                         │
                   └─────────────┘                                         │
                                                                           │
   :9090 ──► ┌────────────┐   :3000 ──► ┌─────────┐   :8080 ──► ┌──────┐  │
             │ Prometheus  │             │ Grafana  │             │cAdvisor│ │
             └──────┬─────┘             └─────────┘             └──────┘  │
                    │                                                     │
                    └── scrapes ──► cadvisor + node-exporter + backend    │
                                                                          │
                                              :9100 ──► ┌──────────────┐  │
                                                        │node-exporter │  │
                                                        └──────────────┘  │
```

## Services

| Service | Description | Port |
|---------|-------------|------|
| `backend` | Express API (dev) - single instance | 5050 |
| `backend-1` | Express API (prod replica 1) | internal |
| `backend-2` | Express API (prod replica 2) | internal |
| `frontend` | React dev server (Vite) | 5173 |
| `frontend-prod` | React static build (Nginx) | internal |
| `mongodb` | MongoDB 7.0 database | 27017 |
| `nginx` | Reverse proxy & load balancer | **80** |
| `prometheus` | Metrics collection & storage | 9090 |
| `grafana` | Monitoring dashboards | 3000 |
| `cadvisor` | Docker container metrics | 8080 |
| `node-exporter` | Host system metrics | 9100 |

## Exposed Ports

| Port | Service | Purpose |
|------|---------|---------|
| **80** | Nginx | Application entry point (production) |
| 5050 | Backend | Direct API access (development) |
| 5173 | Frontend | Direct dev server access |
| 27017 | MongoDB | Direct database access |
| 3000 | Grafana | Monitoring dashboards |
| 8080 | cAdvisor | Container metrics UI |
| 9090 | Prometheus | Metrics queries |
| 9100 | Node Exporter | Host metrics |

## Quick Start

### Development (original setup)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5050
- MongoDB: mongodb://localhost:27017

### Full Production Stack

```bash
docker compose up --build -d
```

This starts all services including the two backend replicas, Nginx load balancer, and monitoring stack.

### Stopping

```bash
docker compose down
```

### Stopping and removing volumes

```bash
docker compose down -v
```

## Load Balancing

Two backend replicas (`backend-1` and `backend-2`) are load-balanced by Nginx using round-robin distribution. The upstream configuration in `nginx/nginx.conf` routes API requests across both replicas:

```nginx
upstream backend_upstream {
    server backend-1:5050 max_fails=3 fail_timeout=30s;
    server backend-2:5050 max_fails=3 fail_timeout=30s;
}
```

Requests to the following routes are distributed across both backend instances:
- `/health`
- `/metrics`
- `/record/*`
- `/employees/*`
- `/departments/*`
- `/attendance/*`
- `/leave/*`
- `/payroll/*`
- `/reports/*`
- `/settings/*`

All other requests are proxied to the frontend container.

## Monitoring

### Prometheus

- **URL:** http://localhost:9090
- **Scrape targets:**
  - `prometheus` (self-monitoring) — `localhost:9090`
  - `backend-1` — `backend-1:5050/metrics`
  - `backend-2` — `backend-2:5050/metrics`
  - `cadvisor` — `cadvisor:8080` (container CPU, memory, network)
  - `node-exporter` — `node-exporter:9100` (host CPU, memory, disk, network)

### Grafana

- **URL:** http://localhost:3000
- **Login:**
  - Username: `admin`
  - Password: `admin`
- **Pre-provisioned datasource:** Prometheus (`http://prometheus:9090`)
- **Pre-provisioned dashboard:** "MERN Container Metrics" with panels for:
  - Backend CPU usage
  - Backend memory usage
  - Infrastructure memory usage
  - Container status (running count)
  - Network traffic (core services)
  - HTTP request rate
  - Response time (p50, p95, avg)
  - All containers memory usage

### Backend Metrics Endpoint

The backend exposes a `/metrics` endpoint (Prometheus-compatible) at `http://backend:5050/metrics` with:
- Default Node.js process metrics (CPU, memory, event loop, GC)
- `http_request_duration_seconds` — histogram of request latency
- `http_requests_total` — counter of total requests by method, route, status

## HTTPS / TLS

The Nginx configuration includes a commented-out HTTPS server block. To enable:

1. Place your certificates at `nginx/ssl/fullchain.pem` and `nginx/ssl/privkey.pem`
2. Uncomment the HTTPS `server` block in `nginx/nginx.conf`
3. Add an SSL volume mount to the nginx service in `docker-compose.yml`:
   ```yaml
   volumes:
     - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
     - ./nginx/ssl:/etc/nginx/ssl:ro
   ```
4. Restart: `docker compose up -d nginx`

## Configuration Files

```
.
├── docker-compose.yml                          # Main compose file (dev + production infra)
├── docker-compose.prod.yml                     # Standalone production overlay
├── nginx/
│   └── nginx.conf                              # Nginx reverse proxy & load balancer config
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml                      # Prometheus scrape configuration
│   └── grafana/
│       └── provisioning/
│           ├── datasources/
│           │   └── datasource.yml              # Prometheus datasource
│           └── dashboards/
│               ├── dashboard.yml               # Dashboard provider config
│               └── mern-dashboard.json         # Pre-built Grafana dashboard
└── mern/
    ├── backend/
    │   ├── server.js                           # Express server with /metrics endpoint
    │   ├── package.json                        # Includes prom-client dependency
    │   └── Dockerfile
    └── frontend/
        ├── Dockerfile                          # Multi-stage: development + production
        └── nginx/
            └── default.conf                    # Static file serving config
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKER_USERNAME` | `local` | Docker Hub namespace for image tags |
| `IMAGE_TAG` | `latest` | Image tag for production builds |
| `MONGO_URI` | `mongodb://mongodb:27017` | MongoDB connection string |
| `PORT` | `5050` | Backend server port |
| `VITE_API_URL` | `http://localhost:5050` | API URL used by frontend |

## Project Structure

The project follows the original MERN structure. Production infrastructure is added alongside without modifying existing application code or folder layout. The `docker-compose.yml` contains both development services (`backend`, `frontend`, `mongodb`) and production infrastructure (`backend-1`, `backend-2`, `frontend-prod`, `nginx`, `prometheus`, `grafana`, `cadvisor`, `node-exporter`).
