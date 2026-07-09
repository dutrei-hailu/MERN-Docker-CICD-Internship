# MERN Docker Compose + CI/CD Project

## Overview

A full-stack MERN application containerized with Docker and managed using Docker Compose.

## Technology Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Containerization: Docker
- Orchestration: Docker Compose
- Registry: Docker Hub
- CI/CD: GitHub Actions

---

# Project Structure

```
MERN-docker-compose/

├── mern/
│   ├── frontend/
│   │   └── Dockerfile
│   │
│   └── backend/
│       └── Dockerfile
│
├── docker-compose.yaml
│
└── .github/
    └── workflows/
        └── ci.yml
```

---

# Day 1: Local Dockerization

## Run Application

Start all services:

```bash
sudo docker compose up
```

Services:

| Service | Port |
|---|---|
| Frontend | 5173 |
| Backend | 5050 |
| MongoDB | 27017 |

---

# Docker Compose

`docker-compose.yaml` manages:

- Containers
- Networks
- Ports
- Environment variables
- Database volumes
- Service dependencies

Container communication:

```
Frontend
    |
    | http://backend:5050
    |
Backend
    |
    | mongodb://mongo:27017
    |
MongoDB
```

Docker Compose uses service names as hostnames instead of localhost.

---

# Dockerfile

Example backend Dockerfile:

```dockerfile
FROM node:18.9.1

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 5050

CMD ["npm","start"]
```

Dockerfile purpose:

- Select base image
- Install dependencies
- Copy application files
- Expose application port
- Start the application

---

# Docker Network

Docker creates a bridge network for container communication.

Check networks:

```bash
docker network ls
```

Example:

```
frontend → backend → mongodb
```

---

# Database Persistence

MongoDB data is stored using a named volume:

```yaml
volumes:
  - mongo-data:/data/db
```

Check volumes:

```bash
docker volume ls
```

The database remains available after restarting containers.

---

# Day 2: Docker Hub Workflow

## Login to Docker Hub

```bash
docker login
```

Use Docker Hub username and Personal Access Token.

---

## View Images

```bash
docker images
```

---

## Tag Images

Example:

```bash
docker tag mern-backend username/mern-backend:v1

docker tag mern-frontend username/mern-frontend:v1
```

---

## Push Images

```bash
docker push username/mern-backend:v1

docker push username/mern-frontend:v1
```

---

## Pull Images on Another Machine

```bash
docker pull username/mern-backend:v1

docker pull username/mern-frontend:v1
```

The application can run without the original source code.

---

# Day 3: CI Pipeline

GitHub Actions workflow location:

```
.github/workflows/ci.yml
```

Pipeline flow:

```
Git Push
    |
GitHub Actions
    |
Run Tests
    |
Build Docker Images
    |
Push Images to Docker Hub
```

CI/CD handles:

- Automated testing
- Docker image building
- Image publishing
- Secure secrets management

---

# Important Docker Commands

## Start Containers

```bash
sudo docker compose up
```

## Run in Background

```bash
sudo docker compose up -d
```

## Stop Containers

```bash
sudo docker compose down
```

## Check Running Containers

```bash
docker ps
```

## Check Compose Services

```bash
docker compose ps
```

## View Logs

```bash
docker compose logs backend
```

## Rebuild Images

```bash
docker compose up --build
```

## Check Port Usage

```bash
sudo lsof -i :5173
```

---

# Testing Backend

Check API response:

```bash
curl http://localhost:5050/record
```

Expected response:

```json
[
  {
    "name":"example"
  }
]
```

---
