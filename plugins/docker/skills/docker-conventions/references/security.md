# Container Security

## Non-Root Execution

Running as root inside a container means a container escape vulnerability gives the attacker root on the host. Running as a non-root user is the most impactful single security control.

### Creating a Dedicated User

```dockerfile
# Debian/Ubuntu-based
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --no-create-home appuser
USER appuser

# Alpine-based
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### Using Built-In Users

Many official images include a non-root user:

| Image | Built-in user | Usage |
|---|---|---|
| `node:*` | `node` (uid 1000) | `USER node` |
| `mcr.microsoft.com/dotnet/aspnet:*` | `app` (uid 1654) | `USER app` |
| `python:*` | None | Create your own |
| `gcr.io/distroless/*:nonroot` | `nonroot` (uid 65532) | Use `nonroot` tag |

### File Ownership

When copying files into the image, set ownership so the non-root user can read them:

```dockerfile
COPY --chown=appuser:appgroup ./publish /app
```

Or set permissions explicitly:

```dockerfile
COPY ./publish /app
RUN chmod -R 555 /app
```

## Image Scanning

### Dockerfile Linting with Hadolint

Hadolint catches common Dockerfile mistakes before the image is even built:

```bash
# Local
hadolint Dockerfile

# In CI (GitHub Actions)
- name: Lint Dockerfile
  uses: hadolint/hadolint-action@v3.1.0
  with:
    dockerfile: Dockerfile
```

Common rules Hadolint catches:
- `DL3008`: Pin versions in `apt-get install`
- `DL3018`: Pin versions in `apk add`
- `DL3025`: Use JSON notation for CMD/ENTRYPOINT
- `DL4006`: Set `SHELL` option for pipefail in RUN pipes

### Vulnerability Scanning with Trivy

Trivy scans OS packages and application dependencies for known CVEs:

```bash
# Scan a local image
trivy image myapp:latest

# Scan and fail on critical/high
trivy image --severity CRITICAL,HIGH --exit-code 1 myapp:latest

# Scan a Dockerfile without building
trivy config Dockerfile
```

### CI/CD Integration Example

```yaml
# GitHub Actions
- name: Build image
  run: docker build -t myapp:${{ github.sha }} .

- name: Scan with Trivy
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    severity: CRITICAL,HIGH
    exit-code: 1
```

## Image Signing

Image signing ensures that only verified images are deployed. Without it, an attacker who compromises your registry can replace images with malicious ones.

### Cosign (Recommended)

```bash
# Generate a key pair
cosign generate-key-pair

# Sign an image
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# Verify an image
cosign verify --key cosign.pub myregistry.io/myapp:v1.0.0
```

### Keyless Signing with Sigstore

For CI/CD pipelines, keyless signing uses OIDC identity (e.g., GitHub Actions workload identity) so you never manage private keys:

```yaml
- name: Sign image
  run: cosign sign --yes myregistry.io/myapp:${{ github.sha }}
  env:
    COSIGN_EXPERIMENTAL: "1"
```

## Linux Capabilities

By default, Docker grants containers a set of Linux capabilities (e.g., `NET_RAW`, `CHOWN`, `SETUID`). Most applications need none of them.

```bash
# Drop all capabilities, add back only what's needed
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp
```

```yaml
# docker-compose.yml
services:
  api:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

Common capabilities and when you might need them:

| Capability | Purpose | Needed when |
|---|---|---|
| `NET_BIND_SERVICE` | Bind to ports below 1024 | Rarely -- use ports above 1024 instead |
| `CHOWN` | Change file ownership | Rarely -- set ownership at build time |
| `SETUID`/`SETGID` | Change process UID/GID | Rarely -- use `USER` in Dockerfile |
| `SYS_PTRACE` | Debug processes | Development/debugging only |

## Secrets Management

Secrets must never be baked into image layers. Even if deleted in a later layer, they remain accessible in the image history.

### Build-Time Secrets (BuildKit)

Use Docker BuildKit's `--mount=type=secret` to make secrets available during build without persisting them in any layer:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
docker build --secret id=npmrc,src=$HOME/.npmrc .
```

### Runtime Secrets

- **Environment variables:** Simplest option, suitable for non-sensitive config. Visible in `docker inspect`.
- **Docker secrets (Swarm):** Mounted as files at `/run/secrets/<name>`. Not visible in inspect.
- **Kubernetes secrets:** Mounted as files or injected as environment variables. Use sealed-secrets or external-secrets-operator for encryption at rest.
- **Vault/cloud secrets managers:** For high-security environments, inject secrets from HashiCorp Vault, Azure Key Vault, or AWS Secrets Manager at container startup.

## Read-Only Filesystem

Run containers with a read-only root filesystem to prevent an attacker from modifying application binaries or writing malware:

```bash
docker run --read-only --tmpfs /tmp myapp
```

```yaml
# docker-compose.yml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
```

Mount `tmpfs` for directories the application needs to write to temporarily (e.g., `/tmp`).

## Network Security

- Do not expose ports unnecessarily. Only publish ports that external clients need.
- Use custom bridge networks for inter-container communication (provides DNS resolution and isolation).
- In production, use network policies (Kubernetes) or firewall rules to restrict egress and ingress.
