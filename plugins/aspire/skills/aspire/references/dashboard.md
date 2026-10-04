# Dashboard — Complete Reference

The Aspire Dashboard provides real-time observability for all resources in your distributed application. It launches automatically with `aspire start` (13.2+) or `aspire run` and can also run standalone.

---

## Features

### Resources view

Displays all resources (projects, containers, executables) with:

- **Name** and **type** (Project, Container, Executable)
- **State** (Starting, Running, Stopped, FailedToStart, etc.)
- **Start time** and **uptime**
- **Endpoints** — clickable URLs for each exposed endpoint
- **Source** — project path, container image, or executable path
- **Actions** — Stop, Start, Restart buttons, plus a built-in **Rebuild** command for containers and projects (13.3+)

### Console logs

Aggregated raw stdout/stderr from all resources:

- Filter by resource name
- Search within logs
- Auto-scroll with pause
- Color-coded by resource

### Structured logs

Application-level structured logs (via ILogger, OpenTelemetry):

- **Filterable** by resource, log level, category, message content
- **Expandable** — click to see full log entry with all properties
- **Correlated** with traces — click to jump to the related trace
- Supports .NET ILogger structured logging properties
- Supports OpenTelemetry log signals from any language

### Distributed traces

End-to-end request traces across all services:

- **Waterfall view** — shows the full call chain with timing
- **Span details** — HTTP method, URL, status code, duration
- **Database spans** — SQL queries, connection details
- **Messaging spans** — queue operations, topic publishes
- **Error highlighting** — failed spans shown in red
- **Cross-service correlation** — trace context propagated automatically for .NET; manual for other languages

### Metrics

Real-time and historical metrics:

- **Runtime metrics** — CPU, memory, GC, thread pool
- **HTTP metrics** — request rate, error rate, latency percentiles
- **Custom metrics** — any metrics your services emit via OpenTelemetry
- **Chartable** — time-series graphs for each metric

### GenAI Visualizer

For applications using AI/LLM integrations:

- **Token usage** — prompt tokens, completion tokens, total tokens per request
- **Prompt/completion pairs** — see the exact prompt sent and response received
- **Model metadata** — which model, temperature, max tokens
- **Latency** — time per AI call
- Requires services to emit [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) via OpenTelemetry

### Notification center (13.3+)

A notification center surfaces resource command results and lifecycle events (e.g. the outcome of a Rebuild or a custom resource command) directly in the dashboard UI.

### Linking to the dashboard

Use only dashboard URLs the CLI returns (`aspire describe --format Json`, `aspire otel … --format Json`,
the login URL from `aspire start`) — don't construct dashboard URLs by hand; ports and tokens are dynamic.

### Browser logs vs. browser telemetry (13.3+)

Two complementary client-side features surface in the dashboard:

- **Browser logs** — `Aspire.Hosting.Browsers` + `.WithBrowserLogs()` in the AppHost (`aspire add browsers`). Aspire adds a child resource `<parent>-browser-logs`, attaches a tracked Chromium session to the parent's URL over the Chrome DevTools Protocol, and streams console output, errors, and network events into the **child resource's console log** (`aspire logs <parent>-browser-logs`, not `aspire otel logs <parent>`); the child exposes **Open tracked browser** (`open-tracked-browser`), **Configure tracked browser**, and **Capture screenshot** (`capture-screenshot`) commands. Experimental — suppress `ASPIREBROWSERLOGS001` in C#. See [Polyglot APIs](polyglot-apis.md).
- **Browser telemetry** — the OpenTelemetry **JavaScript SDK** running inside your front-end app, sending client-side traces/logs/metrics to the dashboard's OTLP endpoint. Configured in the front-end app code (not the AppHost), and enabled on the dashboard via OTLP/CORS settings.

### What's new in 13.6

- **Persistent telemetry & run history** — telemetry is stored in a versioned SQLite database. The
  dashboard keeps up to **10 completed runs** per application (read-only) and adds a **run selector** in
  the header to switch between the live run and history. Filtering, search, paging, and aggregation work
  on persisted data.
- **Persistence modes** — `Run` is the default for AppHost-started dashboards, `None` for standalone.
  Resume a standalone dashboard with
  `aspire dashboard run --application-name my-app --persistence Resume`. Sessions and auth/antiforgery
  cookie names are scoped per application name, so several dashboards don't clobber each other.
- **Higher telemetry limits** — defaults raised to 100,000 each for console logs, structured logs, and
  traces (bounded retention: oldest entries are dropped).
- **Terminal dock** — resizable dock for terminal tabs (toggle with the backtick key) hosting
  `WithTerminal()` sessions, AppHost-owned terminals (`TerminalService`, experimental
  `ASPIRETERMINAL001`), and database/cache **REPLs** from `WithRepl()` (PostgreSQL, MySQL, MongoDB,
  SQL Server, Redis, Valkey — authenticated shells, no local client install).
- **"Manage" links** — management-UI integrations (e.g. pgAdmin-style tools) surface a Manage link on
  the resource. Dev tunnel URLs appear as highlighted properties plus a **Show tunnel URLs** command.
- **Blazor WebAssembly debugging** — standalone and hosted WASM apps expose commands to start/stop an
  Edge or Chrome debugging session.
- **UI** — Fluent UI Blazor v5 with a collapsible navigation rail; the standalone dashboard is a Native
  AOT executable. `azure-environment` is hidden when all Azure resources run as local emulators.
- **Fixes** — database spans resolve to the right database resource, multi-path icons no longer break
  the graph view, stricter Markdown link validation, cross-origin `/_blazor` WebSocket upgrades rejected.

### What's new in 13.5

- **Official branding & visual refresh** — new design-token system with accessibility improvements across the UI.
- **Timestamp filter for telemetry** — filter logs and traces by timestamp via a dedicated search qualifier in the filter dialog.
- **Numeric equality operators** — the telemetry filter dialog adds `==` and `!=` for exact numeric matching.
- **Console-logs text filter** — filter console-log output by text.
- **Terminal view** — resources configured with the experimental `WithTerminal()` open in an interactive terminal view by default; resources that are waiting, starting, exited, or failed fall back to the console-logs view until they reach Running. See [CLI Reference](cli-reference.md) for the `aspire terminal` command group.
- **Reconnect modal** — a clearer modal appears when the dashboard loses its connection to the AppHost.
- **Quality fixes** — friendlier health-check error messages (instead of raw exception stacks), deduplicated replica display names, and correct telemetry streaming when resource filters are applied.

---

## Dashboard URL

By default, the dashboard runs on an auto-assigned port. Find it:

- In the terminal output when the app starts
- Via CLI: `aspire describe` (13.2+)
- Via MCP: `list_resources` tool
- Override with `--dashboard-port` (foreground mode):

```bash
aspire run --dashboard-port 18888
```

> **13.2+ note:** The VS Code extension shows a live tree view of running apphosts using `aspire describe --follow`.

---

## Standalone Dashboard

Run the dashboard without an AppHost — useful for existing applications that already emit OpenTelemetry.

**Via the CLI (13.3+):**

```bash
aspire dashboard run
```

**Via the container image:**

```bash
docker run --rm -d \
  -p 18888:18888 \
  -p 4317:18889 \
  mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

| Port             | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `18888`          | Dashboard web UI                                             |
| `4317` → `18889` | OTLP gRPC receiver (standard OTel port → dashboard internal) |

### Configure your services

Point your OpenTelemetry exporters at the dashboard:

```bash
# Environment variables for any language's OpenTelemetry SDK
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=my-service
```

### Docker Compose example

```yaml
services:
  dashboard:
    image: mcr.microsoft.com/dotnet/aspire-dashboard:latest
    ports:
      - "18888:18888"
      - "4317:18889"

  api:
    build: ./api
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://dashboard:18889
      - OTEL_SERVICE_NAME=api

  worker:
    build: ./worker
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://dashboard:18889
      - OTEL_SERVICE_NAME=worker
```

---

## Dashboard configuration

### Authentication

The standalone dashboard supports authentication via browser tokens:

```bash
docker run --rm -d \
  -p 18888:18888 \
  -p 4317:18889 \
  -e DASHBOARD__FRONTEND__AUTHMODE=BrowserToken \
  -e DASHBOARD__FRONTEND__BROWSERTOKEN__TOKEN=my-secret-token \
  mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

### OTLP configuration

```bash
# Accept OTLP over gRPC (default)
-e DASHBOARD__OTLP__GRPC__ENDPOINT=http://0.0.0.0:18889

# Accept OTLP over HTTP
-e DASHBOARD__OTLP__HTTP__ENDPOINT=http://0.0.0.0:18890

# Require API key for OTLP
-e DASHBOARD__OTLP__AUTHMODE=ApiKey
-e DASHBOARD__OTLP__PRIMARYAPIKEY=my-api-key
```

### Resource limits

```bash
# Limit log entries retained
-e DASHBOARD__TELEMETRYLIMITS__MAXLOGCOUNT=10000

# Limit trace entries retained
-e DASHBOARD__TELEMETRYLIMITS__MAXTRACECOUNT=10000

# Limit metric data points
-e DASHBOARD__TELEMETRYLIMITS__MAXMETRICCOUNT=50000
```

---

## AI / agentic integration

> **Changed in 13.3:** The in-dashboard GitHub Copilot chat UI (and the dashboard-embedded MCP server, along with `ASPIRE_DASHBOARD_MCP_ENDPOINT_URL`) was **removed** in favor of an agentic development model.
>
> **Changed in 13.5:** The remaining dashboard **AI Assistant** chat UI was removed as well — the `aspire agent init` flow is the only supported AI path.

To query resource status, logs, and traces with an AI assistant, configure the **AppHost-level MCP server** via `aspire agent init` and use your assistant (Claude Code, VS Code + GitHub Copilot, Copilot CLI, etc.). See [MCP Server](mcp-server.md).

---

## Non-.NET service telemetry

For non-.NET services to appear in the dashboard, they must emit OpenTelemetry signals. Aspire auto-injects the OTLP endpoint env var when using `.WithReference()`:

### Python (OpenTelemetry SDK)

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
import os

# Aspire injects OTEL_EXPORTER_OTLP_ENDPOINT automatically
endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
trace.set_tracer_provider(provider)
```

### JavaScript (OpenTelemetry SDK)

```javascript
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-grpc");

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317",
    })
  )
);
provider.register();
```
