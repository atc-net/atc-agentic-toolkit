---
name: blazor-conventions
description: >
  Best practices and conventions for Blazor application development including Razor component structure,
  component lifecycle methods (OnInitializedAsync, OnParametersSetAsync), data binding, state management
  patterns, Server vs WebAssembly optimization, caching strategies, and error handling with ErrorBoundary.
  Use this skill whenever writing, reviewing, or refactoring Blazor components or pages — including when
  the user mentions Razor components, Blazor Server, Blazor WebAssembly (WASM), render optimization,
  cascading parameters, component parameters, or Blazor forms and validation, even if they do not
  explicitly say "Blazor best practices."
user-invocable: false
---

# Blazor Development Conventions

Apply these practices when writing, reviewing, or refactoring Blazor applications.

## Code Style and Structure

- Write idiomatic Blazor and C# code that follows established .NET conventions
- Use Razor Components (`.razor` files) for all component-based UI
- For complex components with injected services or significant logic, use the **code-behind with `@inherits`** pattern: define a base class (e.g., `DeviceDetailsBase : NexusPageComponentBase`) and reference it with `@inherits DeviceDetailsBase` in the `.razor` file
- Keep small, presentational components inline with `@code { }` blocks
- Create **custom base components** for shared concerns across pages — e.g., a `PageComponentBase` that provides common injections (`NavigationManager`, `AuthenticationState`, `ISnackbar`) and helper methods (`IsAuthenticatedAsync()`, `RedirectToLogin()`)
- Use `async`/`await` for all non-blocking UI operations — never block on `Task.Result` or `.Wait()` inside components, as this deadlocks the synchronization context

## Naming Conventions

- **PascalCase** for components, methods, properties, public members, and component parameters
- **camelCase** for private fields and local variables
- Prefix private fields with underscore (`_orderService`)
- Prefix interfaces with `I` (`IOrderService`)
- Name component files to match the component class (`OrderList.razor` for `OrderList`)

## Component Lifecycle

Blazor components follow a well-defined lifecycle. Understanding when each method runs prevents redundant work and subtle bugs.

| Method | When it runs | Typical use |
|---|---|---|
| `SetParametersAsync` | On every parameter update, before other lifecycle methods | Low-level parameter interception (rarely overridden directly) |
| `OnInitialized` / `OnInitializedAsync` | Once when the component first initializes | Initial data loading, one-time setup |
| `OnParametersSet` / `OnParametersSetAsync` | After parameter values are set (on init and every update) | Reacting to parameter changes, recomputing derived state |
| `OnAfterRender` / `OnAfterRenderAsync` | After each render, with `firstRender` flag | JS interop calls, DOM measurements, third-party library init |
| `Dispose` / `DisposeAsync` | When the component is removed from the render tree | Unsubscribe from events, cancel `CancellationTokenSource`, release resources |

- Implement `IDisposable` or `IAsyncDisposable` to clean up event subscriptions and cancellation tokens — leaked subscriptions cause memory leaks and ghost updates
- Use `firstRender` in `OnAfterRenderAsync` to run one-time JS interop or DOM setup
- Avoid calling `StateHasChanged()` inside `OnInitializedAsync` or `OnParametersSetAsync` — Blazor calls it automatically after these methods complete

## Data Binding

- Use `@bind` for two-way binding to input elements: `<input @bind="searchText" />`
- Use `@bind:event` to control when the binding updates (e.g., `@bind:event="oninput"` for real-time updates vs the default `onchange`)
- Use `@bind:after` to run logic after a bound value changes without writing a manual setter
- For component parameters, expose a `Value` / `ValueChanged` pair to support `@bind-Value` from parent components:

```razor
[Parameter] public string Value { get; set; } = string.Empty;
[Parameter] public EventCallback<string> ValueChanged { get; set; }
```

## Component Communication

- **Parent to child**: pass data via `[Parameter]` properties
- **Child to parent**: use `EventCallback<T>` to notify the parent of changes
- **Deep tree sharing**: use `[CascadingParameter]` with `<CascadingValue>` to avoid prop-drilling through intermediate components
- Keep `EventCallback` over `Action`/`Func` for event handling — `EventCallback` automatically triggers a re-render on the correct component and handles async delegates

## Dependency Injection

In code-behind base classes, use `[Inject]` on properties. In `.razor` files, use `@inject`:

```csharp
// Code-behind pattern (preferred for complex components)
[Inject] protected GatewayService GatewayService { get; set; }
[Inject] protected IDialogService DialogService { get; set; }
[Inject] protected ISnackbar SnackBarService { get; set; }
[Inject] protected NavigationManager Navigation { get; set; }
```

- Register services with the correct scope: `Scoped` for per-circuit (Server) or per-user (WASM) services, `Singleton` for shared state and hub connections, `Transient` for stateless utilities
- Avoid injecting `Scoped` services into `Singleton` services — this captures a stale instance (the captive dependency problem)

## Separation of Concerns

- Components handle UI rendering and user interaction only
- Extract business logic into injectable services
- Use dedicated model or DTO classes for data transfer — do not pass entity or database models directly to components
- Isolate HTTP calls in typed service classes rather than calling `HttpClient` directly from components

## Modern C# Features

Leverage current C# language features for clarity and conciseness:

- **Records** for immutable data models and DTOs (`record OrderDto(int Id, string Name, decimal Total);`)
- **Pattern matching** in event handlers and conditional rendering logic
- **Global usings** in `_Imports.razor` for commonly used namespaces
- **File-scoped namespaces** in code-behind files
- **Nullable reference types** — enable project-wide and handle nullability explicitly in component parameters and service returns

## Error Handling and Validation

### Page and API Error Handling

- Wrap data-loading calls in try-catch within lifecycle methods and present user-friendly feedback via `ISnackbar`:

```csharp
try
{
    await LoadDataAsync(cancellationToken);
}
catch (UnauthorizedAccessException)
{
    RedirectToLogin();
}
catch (Exception ex)
{
    SnackBarService.Add($"Failed to load data: {ex.Message}", Severity.Error);
}
```

- Catch `NavigationException` separately — it is expected in Blazor Server when navigation aborts rendering
- Use `ErrorBoundary` for catching unhandled rendering exceptions when appropriate
- Configure a global error handler page with `app.UseExceptionHandler("/Error")`

### Form and Input Patterns

- Use `EditForm` with `DataAnnotationsValidator` for form-heavy scenarios with validation
- For search/filter UIs, use component library inputs (e.g., `MudTextField`, `MudSelect`) with debouncing:

```razor
<MudTextField DebounceInterval="500"
              OnDebounceIntervalElapsed="ApplyFilters"
              @bind-Value="SearchQuery"
              Placeholder="Search..." />
```

## Performance Optimization

Blazor re-renders components more often than you might expect. These patterns keep the UI responsive.

### Reduce Unnecessary Renders

- Override `ShouldRender()` and return `false` when the component output has not changed — this skips the entire diff and DOM patch cycle
- Use `@key` on list items so Blazor can match existing elements by identity instead of recreating them on every render
- Mark child components with `@rendermode` appropriately (Server vs WebAssembly vs Static SSR) based on interactivity needs
- Avoid allocating new objects (lambdas, collections, anonymous types) inside render logic — each allocation looks like a "change" to the diffing engine

### Server vs WebAssembly Considerations

| Concern | Blazor Server | Blazor WebAssembly |
|---|---|---|
| Initial load | Fast — only a small SignalR connection is established | Slower — the .NET runtime and app assemblies download to the browser |
| Latency | Every UI interaction is a SignalR round-trip | No round-trip for UI logic; HTTP calls only for data |
| Scalability | Each user holds a server circuit and memory | Client-side — the server only serves APIs |
| Offline support | None — requires a persistent connection | Possible with service workers and local caching |
| Data access | Direct access to server-side resources (databases, file system) | Must go through HTTP APIs |

- On Server, minimize SignalR payload by keeping component state small and avoiding large objects in memory per circuit
- On WebAssembly, use lazy loading (`<Router OnNavigateAsync="OnNavigateAsync">`) to defer assembly downloads and reduce initial payload
- Use `IAsyncEnumerable` streaming with Server to progressively render large datasets without loading everything into memory

### Async Methods for API Calls

- Always use async methods (`GetFromJsonAsync`, `PostAsJsonAsync`) for HTTP operations
- Provide a loading indicator while awaiting data to avoid a blank or stale UI

### Efficient Event Handling

- Prefer `EventCallback<T>` over raw delegates for component events — they batch render updates correctly
- Debounce high-frequency events (e.g., search-as-you-type) to avoid flooding the server or triggering excessive re-renders

## Caching Strategies

Choose a caching approach based on the hosting model:

### Blazor Server

- Use `IMemoryCache` for fast, in-process caching of frequently accessed data
- Use a distributed cache (Redis, SQL Server) when running multiple server instances so all circuits share the same cached data
- Register caches as `Singleton` so they survive across circuit lifetimes

### Blazor WebAssembly

- Use `localStorage` for persistent, cross-session data (user preferences, tokens)
- Use `sessionStorage` for per-tab, session-scoped data
- Consider `Blazored.LocalStorage` or `Blazored.SessionStorage` packages for a typed, async-friendly API

### General Caching

- Cache API call responses when the data does not change frequently, and invalidate on relevant mutations
- Use cache-aside pattern: check cache first, fetch from source on miss, store result

## State Management

Choose the right pattern based on complexity:

### Global App State (StateContainer Pattern)

Use a scoped `StateContainer` service for app-wide state like theme, user preferences, or shared UI settings. Expose state via properties and notify components via events:

```csharp
public class StateContainer
{
    public bool IsDarkMode { get; private set; }
    public event Action? OnThemeChange;

    public void UseDarkMode(bool darkMode)
    {
        IsDarkMode = darkMode;
        OnThemeChange?.Invoke();
    }
}
```

Register as `Scoped`, inject into components, subscribe to events, call `StateHasChanged()` in the handler, and unsubscribe in `Dispose`.

### Feature State (DataStateService Pattern)

For feature-specific state (device lists, search filters, real-time updates), create a dedicated scoped service that combines data caching with event notifications:

```csharp
public class DataStateService : IDataStateService, IDisposable
{
    public List<DeviceType> DeviceTypes { get; private set; } = [];
    public DeviceSearchState SearchState { get; } = new();
    public event Action? DeviceStateUpdated;
    // ... fetch, cache, notify
}
```

### Component-Level Persistence

Use `[PersistentState]` (.NET 10+) to automatically serialize/deserialize component state across navigations:

```csharp
[PersistentState]
public List<Device>? Devices { get; set; }
```

### Complex State

For larger applications where many unrelated components need coordinated state, consider Fluxor or Blazor-State for Redux-style unidirectional data flow.

### WebAssembly Persistence

- Use `localStorage` / `sessionStorage` (via `Blazored.LocalStorage` or similar) to persist state across page reloads in WASM apps

## UI Component Libraries

When using a component library like **MudBlazor**, follow its conventions consistently:

- Use library layout components (`MudLayout`, `MudAppBar`, `MudDrawer`, `MudMainContent`) for the application shell
- Use `IDialogService` for modal dialogs and `ISnackbar` for toast notifications instead of custom implementations
- Use library data components (`MudTable`, `MudSelect`, `MudTextField`) with their built-in features (sorting, paging, debouncing)
- Override library styles through **CSS variables** and a centralized override stylesheet rather than per-component hacks
- Wrap the app root with the library's theme provider for consistent theming and dark mode support

## Real-Time Communication

For real-time features, use **SignalR**:

- Create a dedicated hub connection service registered as `Singleton` for connection lifecycle management
- Subscribe to hub events in `DataStateService` or a similar scoped service, and propagate changes via events that components subscribe to
- Handle connection drops gracefully with reconnection logic

## API Integration

- Create a **gateway service** (API facade) that encapsulates all HTTP calls behind a typed interface — components inject this service rather than calling `HttpClient` directly
- Use `IHttpClientFactory` for HTTP client management with named or typed clients
- Handle errors with try-catch and surface user-friendly feedback via `ISnackbar` rather than letting exceptions propagate to the UI
- Use `CancellationToken` with HTTP calls so navigating away cancels in-flight requests

## Streaming and Rendering

- Use `@attribute [StreamRendering]` on pages for improved perceived performance — content renders progressively as data loads
- Show loading indicators while async data is pending

## Testing

- Use **bUnit** for component-level testing — it renders components in a test context and lets you assert on markup, parameters, and events
- Use **xUnit** as the test framework and **NSubstitute** for mocking injected services
- Test component rendering, parameter changes, event callbacks, and lifecycle behavior
- Mock `NavigationManager`, `HttpClient`, and custom services via bUnit's dependency injection

## Security and Authentication

- Use **Microsoft Entra ID** (via `Microsoft.Identity.Web`) for enterprise authentication, or ASP.NET Identity / JWT for other scenarios
- Use `AddCascadingAuthenticationState()` to make auth state available throughout the component tree
- Access auth state in base components via `[CascadingParameter] protected Task<AuthenticationState>? AuthenticationStateTask`
- Protect pages with `[Authorize]` attribute and use `<AuthorizeView>` / `<AuthorizeRouteView>` for conditional rendering
- Use a `BearerTokenHandler` to automatically attach JWT tokens to downstream API calls
- Never store secrets or sensitive tokens in WebAssembly client code — it runs entirely in the browser and is fully inspectable
