---
name: docker-conventions
description: 'Best practices and conventions for Docker, Dockerfiles, docker-compose, and containerization. Covers multi-stage builds, base image selection, layer optimization, .dockerignore, non-root users, CMD vs ENTRYPOINT, health checks, environment configuration, image security scanning, image signing, resource limits, structured logging, persistent volumes, custom networks, and orchestration patterns (Kubernetes, Docker Swarm). Apply this skill whenever creating, reviewing, modifying, or troubleshooting Dockerfiles, docker-compose.yml files, .dockerignore files, or any container-related configuration. Also apply when the user asks about container image optimization, reducing image size, Docker build caching, container security hardening, multi-stage builds, container networking, resource constraints, or deployment to container orchestrators -- even if they do not explicitly mention "Docker" by name.'
user-invocable: false
---

# Docker and Containerization Best Practices

Follow these conventions when creating or modifying Dockerfiles, docker-compose files, and container configurations to produce images that are secure, efficient, and portable.

## Core Principles

Four principles guide every containerization decision:

- **Immutability.** Build a new image for every change. Never patch running containers in place. Tag images with semantic versions (`v1.2.3`) -- not just `latest` -- so every deployment is traceable and rollbacks are straightforward.
- **Portability.** Design images to run identically across dev, staging, and production. Inject environment-specific values at runtime through environment variables or mounted config files, never bake them into the image.
- **Isolation.** Run one process per container. This keeps logging, scaling, health checking, and resource management simple. Use container networking to connect services instead of running multiple processes in a single container.
- **Efficiency.** Smaller images build faster, transfer faster, and expose less attack surface. Every layer, package, and file you add is something an attacker could exploit and a developer must wait for.

## Dockerfile Best Practices

### Multi-Stage Builds

Multi-stage builds are the single most impactful Dockerfile technique. They separate the build environment (compilers, SDKs, dev dependencies) from the runtime image, often cutting image size by 80% or more.

Name every stage so the Dockerfile reads like documentation and stages can be targeted individually with `docker build --target`:

```dockerfile
# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app/publish --no-restore

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
COPY --from=build /app/publish .
USER app
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

For Node.js applications, the same pattern applies:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

### Base Image Selection

The base image determines your floor for image size and vulnerability count. Choose the smallest image that meets your needs:

| Image type | Use case | Typical size |
|---|---|---|
| `alpine` variants | General purpose, includes shell and package manager | 5-50 MB |
| `slim` variants | Debian-based, smaller than full but more compatible | 50-150 MB |
| `distroless` | Production-only, no shell or package manager | 10-30 MB |
| Full images | Only when specific system libraries are required | 200+ MB |

Use `alpine` as the default choice. Fall back to `slim` when Alpine's musl libc causes compatibility issues (some Python C extensions, for example). Reserve `distroless` for hardened production images where you do not need shell access for debugging.

For detailed base image selection guidance and compatibility notes, see [references/base-images.md](references/base-images.md).

### Layer Optimization

Docker caches each layer independently. Understanding this mechanism is the key to fast builds:

1. **Order instructions by change frequency.** Place rarely-changing instructions (base image, system packages) at the top and frequently-changing ones (application code) at the bottom. This maximizes cache hits.

2. **Copy dependency manifests before source code.** This is the most important caching technique -- the dependency install layer is reused unless the manifest changes:

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
# Source code changes don't invalidate the layer above
COPY . .
```

3. **Combine related RUN commands and clean up in the same layer.** Each `RUN` creates a new layer. Files deleted in a subsequent `RUN` still occupy space in the earlier layer:

```dockerfile
# Good: single layer, cleanup included
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Bad: deletion in a separate layer does not reclaim space
RUN apt-get update && apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

4. **Minimize COPY instructions.** Each COPY creates a layer. Copy what you need, not the entire context:

```dockerfile
COPY src/ ./src/
COPY config/ ./config/
```

### .dockerignore

A `.dockerignore` file prevents unnecessary files from entering the build context, which speeds up builds and avoids leaking sensitive data into images:

```
.git
.github
node_modules
dist
*.md
*.log
.env*
**/*.test.*
**/*.spec.*
docker-compose*.yml
.vscode
.idea
```

Place `.dockerignore` in the build context root (usually the repository root). Review it whenever you add new file types to the project.

### CMD vs ENTRYPOINT

- Use `ENTRYPOINT` for the main process the container runs. This makes the container behave like an executable.
- Use `CMD` for default arguments that users can override.
- Always use exec form (JSON array) instead of shell form to ensure the process receives signals correctly and runs as PID 1:

```dockerfile
# Exec form (preferred) -- process receives SIGTERM directly
ENTRYPOINT ["dotnet", "MyApp.dll"]
CMD ["--urls", "http://+:8080"]

# Shell form (avoid) -- wraps in /bin/sh, signals don't propagate
ENTRYPOINT dotnet MyApp.dll
```

### Environment Configuration

Use `ENV` to define configuration with sensible defaults. This makes the container self-documenting and runnable without external config:

```dockerfile
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_EnableDiagnostics=0 \
    TZ=UTC
```

Override at runtime for environment-specific values: `docker run -e DB_HOST=prod-db myapp`.

Never put secrets in `ENV` instructions -- they are visible in the image metadata. Pass secrets at runtime via environment variables, mounted files, or a secrets manager.

## Security

Container security requires attention at build time and runtime. A single misconfiguration can expose your application or the host system.

- **Run as non-root.** This is the most important security control. If the application is compromised, a non-root user limits the blast radius:

```dockerfile
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
```

Many official images provide a built-in non-root user (e.g., `node` for Node.js images, `app` for .NET aspnet images).

- **Scan images.** Integrate static analysis into CI/CD:
  - **Hadolint** for Dockerfile linting (catches common mistakes like missing `--no-install-recommends`)
  - **Trivy** or **Grype** for vulnerability scanning of OS packages and application dependencies
  - Block deployments when critical or high vulnerabilities are found

- **Sign images.** Use Cosign or Docker Content Trust to verify image integrity and provenance. This prevents deploying tampered images.

- **Drop capabilities.** Run containers with `--cap-drop ALL` and add back only what is needed. Most applications need no Linux capabilities at all.

- **Add health checks.** A `HEALTHCHECK` instruction lets Docker and orchestrators know when the application is actually ready to serve traffic:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

For detailed security guidance including image signing workflows, capability management, and secrets handling, see [references/security.md](references/security.md).

## Runtime and Orchestration

### Resource Limits

Always set CPU and memory limits. Without them, a single container can starve the host and every other container on it:

```yaml
# docker-compose.yml
services:
  api:
    image: myapp:1.0.0
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 128M
```

### Logging

Write all application logs to STDOUT and STDERR. Docker captures these streams automatically and forwards them to the configured logging driver. Do not write to log files inside the container -- they are lost when the container stops and make debugging harder.

Use structured logging (JSON format) so log aggregation tools can parse and query fields:

```json
{"timestamp":"2025-01-15T10:30:00Z","level":"info","message":"Request processed","path":"/api/orders","status":200,"duration_ms":42}
```

### Persistent Data

Containers are ephemeral -- any data written to the container filesystem is lost when the container is removed. Use volumes for data that must survive container restarts:

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Never store application state, databases, or uploaded files on the container filesystem.

### Networking

Use custom networks to isolate services and control communication. The default bridge network provides no DNS resolution between containers:

```yaml
services:
  api:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```

In this example, only the `api` service can reach both the frontend and the database. The database is not accessible from the frontend network.

For detailed guidance on orchestration with Kubernetes and Docker Swarm, see [references/orchestration.md](references/orchestration.md).

## Docker Compose Conventions

When writing `docker-compose.yml` files:

- Pin image versions explicitly (`image: postgres:16-alpine`, not `image: postgres`)
- Use `depends_on` with health check conditions for startup ordering:

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
```

- Use `.env` files for variable substitution and `environment` for runtime config
- Define named volumes for persistent data
- Use `profiles` to group optional services (e.g., monitoring, debugging tools)

## Review Checklist

Use this checklist when creating or reviewing Dockerfiles and container configurations.

### Dockerfile Structure
- [ ] Multi-stage build separates build dependencies from runtime
- [ ] Build stages are named descriptively
- [ ] Base image is minimal (`alpine`, `slim`, or `distroless`)
- [ ] Base image version is pinned (not `latest`)
- [ ] `.dockerignore` is present and excludes unnecessary files

### Layer Optimization
- [ ] Dependency manifests copied before source code for caching
- [ ] Related `RUN` commands combined with `&&`
- [ ] Package manager caches cleaned in the same layer as installation
- [ ] `COPY` instructions are specific (not `COPY . .` in the final stage)
- [ ] Instructions ordered by change frequency (least to most)

### Security
- [ ] Container runs as non-root `USER`
- [ ] No secrets in `ENV`, `ARG`, or `COPY` instructions
- [ ] `HEALTHCHECK` instruction defined
- [ ] Image scanning (Hadolint + Trivy/Grype) integrated in CI/CD
- [ ] Capabilities dropped (`--cap-drop ALL`) at runtime
- [ ] Image signing configured for production deployments

### Runtime Configuration
- [ ] `ENTRYPOINT`/`CMD` use exec form (JSON array)
- [ ] Environment variables provide sensible defaults via `ENV`
- [ ] Logs write to STDOUT/STDERR in structured format
- [ ] Resource limits (CPU, memory) defined
- [ ] Volumes used for persistent data
- [ ] Custom networks isolate services appropriately

### Docker Compose
- [ ] Image versions pinned explicitly
- [ ] `depends_on` uses health check conditions
- [ ] Named volumes defined for stateful services
- [ ] Networks configured for service isolation
