# Container Orchestration

## Kubernetes

### Pod Configuration

A well-configured Pod spec covers resource management, health checking, and security:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: myapp
          image: myregistry.io/myapp:v1.2.3
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 250m
              memory: 128Mi
            limits:
              cpu: "1"
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          startupProbe:
            httpGet:
              path: /health/startup
              port: 8080
            failureThreshold: 30
            periodSeconds: 2
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
```

### Key Kubernetes Patterns

**Resource requests and limits:**
- Set `requests` to the typical usage so the scheduler can place pods appropriately
- Set `limits` to the maximum the application should consume
- Without limits, a memory leak in one pod can evict other pods on the same node

**Health probes:**
- `startupProbe`: gates the other probes; use for slow-starting applications
- `livenessProbe`: restarts the container if it becomes unresponsive (deadlock, infinite loop)
- `readinessProbe`: removes the pod from the service load balancer when it cannot handle traffic

**Horizontal Pod Autoscaler (HPA):**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Network Policies:**

Restrict traffic between pods. By default, all pods in a namespace can communicate with each other. Network policies implement a zero-trust model:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - port: 5432
```

## Docker Swarm

Docker Swarm is simpler than Kubernetes and suitable for smaller deployments or teams that want orchestration without Kubernetes complexity.

### Service Definition

```yaml
# docker-compose.yml (Swarm mode)
version: "3.8"
services:
  api:
    image: myregistry.io/myapp:v1.2.3
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 5s
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 128M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - app-network

networks:
  app-network:
    driver: overlay
```

### Rolling Updates

Swarm performs rolling updates by default. The `update_config` block controls the rollout:
- `parallelism`: how many tasks to update at once
- `delay`: wait time between updating batches
- `failure_action`: `rollback` automatically reverts on failure

## Container Registry Best Practices

- Use a private registry for production images (Azure Container Registry, AWS ECR, Google Artifact Registry, GitHub Container Registry)
- Enable vulnerability scanning on the registry (most cloud registries offer this)
- Set image retention policies to clean up old, untagged images
- Use immutable tags in production -- once `v1.2.3` is pushed, it should never be overwritten
- Mirror critical base images to your private registry to avoid rate limits and supply chain risks from public registries
