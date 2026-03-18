# Base Image Selection Guide

## Decision Matrix

Choose the smallest base image that satisfies your application's requirements. Smaller images build faster, transfer faster, start faster, and contain fewer packages that could harbor vulnerabilities.

### Alpine-Based Images

Alpine Linux uses musl libc and BusyBox, producing images in the 5-50 MB range.

**When to use:**
- Go applications (statically compiled, no libc dependency)
- Node.js applications (fully supported on Alpine)
- .NET applications (.NET 8+ has first-class Alpine support)
- Rust applications (statically compiled)
- Any application without native C library dependencies that require glibc

**When to avoid:**
- Python applications with C extensions compiled against glibc (NumPy, Pandas, SciPy) -- these may require recompilation or may not compile at all on musl
- Applications that depend on glibc-specific behavior (locale handling differences, DNS resolution edge cases)

**Package management:** `apk add --no-cache` (the `--no-cache` flag avoids storing the package index, keeping the layer smaller)

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
```

### Slim (Debian-Based) Images

Slim variants are Debian with non-essential packages removed. They use glibc, providing broader compatibility at the cost of larger size (50-150 MB).

**When to use:**
- Python applications with native dependencies
- Applications that require glibc-specific features
- When Alpine causes compatibility issues and you need a quick fix

**Package management:** `apt-get update && apt-get install -y --no-install-recommends <pkg> && rm -rf /var/lib/apt/lists/*`

```dockerfile
FROM python:3.12-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev && \
    rm -rf /var/lib/apt/lists/*
```

### Distroless Images

Google's distroless images contain only the application runtime -- no shell, no package manager, no utilities. This minimizes attack surface dramatically.

**When to use:**
- Production deployments where security is paramount
- Applications that do not need shell access at runtime
- Environments where you debug via logging and external tooling, not exec into containers

**When to avoid:**
- Development and debugging (no shell means no `docker exec -it ... sh`)
- Applications that shell out to external commands

**Available runtimes:** `gcr.io/distroless/static`, `gcr.io/distroless/base`, `gcr.io/distroless/java`, `gcr.io/distroless/nodejs`, `gcr.io/distroless/python3`, `gcr.io/distroless/dotnet`

```dockerfile
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server .

FROM gcr.io/distroless/static:nonroot
COPY --from=build /server /server
ENTRYPOINT ["/server"]
```

### Scratch (Empty) Images

The `scratch` image is completely empty -- zero bytes. It is suitable only for statically-linked binaries.

**When to use:**
- Go binaries compiled with `CGO_ENABLED=0`
- Rust binaries compiled with `--target x86_64-unknown-linux-musl`
- Any fully static binary

```dockerfile
FROM scratch
COPY --from=build /app/binary /binary
ENTRYPOINT ["/binary"]
```

## Language-Specific Recommendations

| Language | Build stage | Runtime stage |
|---|---|---|
| .NET | `mcr.microsoft.com/dotnet/sdk:8.0-alpine` | `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` |
| Node.js | `node:20-alpine` | `node:20-alpine` |
| Python | `python:3.12-slim` | `python:3.12-slim` |
| Go | `golang:1.22-alpine` | `gcr.io/distroless/static` or `scratch` |
| Java | `eclipse-temurin:21-jdk-alpine` | `eclipse-temurin:21-jre-alpine` |
| Rust | `rust:1.77-alpine` | `gcr.io/distroless/static` or `scratch` |

## Version Pinning Strategy

- Pin to major.minor for base images (`node:20-alpine`, not `node:alpine` or `node:latest`)
- Pin to exact versions in production Dockerfiles when reproducibility is critical (`node:20.11.1-alpine3.19`)
- Use Dependabot or Renovate to automate base image updates
- Rebuild images regularly (at least weekly) to pick up security patches in base image OS packages
