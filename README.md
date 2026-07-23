# MERN Stack with Docker Compose

A production-ready MERN (MongoDB, Express, React, Node.js) application using Docker Compose with Nginx reverse proxy, load balancing, Prometheus monitoring, and Grafana dashboards.

## Features

- Docker Compose deployment
- MongoDB database
- React (Vite) frontend
- Express.js backend
- Nginx reverse proxy
- Two backend replicas with round-robin load balancing
- Prometheus metrics collection
- Grafana monitoring dashboard
- cAdvisor container monitoring
- Node Exporter host metrics

## Architecture

```
Client
   │
   ▼
 Nginx (:80)
   │
   ├── Frontend
   └── Backend Load Balancer
          ├── backend-1
          └── backend-2
                 │
              MongoDB

Monitoring
├── Prometheus (:9090)
├── Grafana (:3000)
├── cAdvisor (:8080)
└── Node Exporter (:9100)
```

## Services

| Service | Port |
|----------|------|
| Nginx | 80 |
| Frontend (Dev) | 5173 |
| Backend | 5050 |
| MongoDB | 27017 |
| Prometheus | 9090 |
| Grafana | 3000 |
| cAdvisor | 8080 |
| Node Exporter | 9100 |

## Run the Project

Start all services:

```bash
docker compose up --build -d
```

Stop the project:

```bash
docker compose down
```

Remove containers and volumes:

```bash
docker compose down -v
```

## Access the Application

| Service | URL |
|----------|-----|
| Application | http://localhost |
| Backend API | http://localhost:5050 |
| Frontend (Dev) | http://localhost:5173 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Grafana Login:

- Username: `admin`
- Password: `admin`

## Load Balancing

Nginx distributes API requests between two backend containers using round-robin load balancing.

## Monitoring

Prometheus collects metrics from:

- Backend services
- cAdvisor
- Node Exporter

Grafana provides pre-configured dashboards for:

- CPU usage
- Memory usage
- Network traffic
- HTTP request rate
- Response times
- Container health

## Project Structure

```
.
├── docker-compose.yml
├── nginx/
├── monitoring/
└── mern/
    ├── backend/
    └── frontend/
```

## Environment Variables

| Variable | Default |
|----------|---------|
| MONGO_URI | mongodb://mongodb:27017 |
| PORT | 5050 |
| VITE_API_URL | http://localhost:5050 |

## Project Structure

The project follows the original MERN structure. Production infrastructure is added alongside without modifying existing application code or folder layout. The `docker-compose.yml` contains both development services (`backend`, `frontend`, `mongodb`) and production infrastructure (`backend-1`, `backend-2`, `frontend-prod`, `nginx`, `prometheus`, `grafana`, `cadvisor`, `node-exporter`).
