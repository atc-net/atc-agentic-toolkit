# Client Generation Reference

Guide to generating C# and TypeScript HTTP clients from OpenAPI specifications.

---

## C# Client Generation Modes

### TypedClient Mode

Generates a single client class with all endpoints as methods:

```csharp
public class PetStoreClient
{
    public Task<Pet> GetPetByIdAsync(Guid petId, CancellationToken ct = default);
    public Task<List<Pet>> GetPetsAsync(int pageSize = 10, CancellationToken ct = default);
    public Task<Pet> CreatePetAsync(CreatePetRequest request, CancellationToken ct = default);
}
```

**DI Registration:**
```csharp
services.AddHttpClient<PetStoreClient>(client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
});
```

### EndpointPerOperation Mode

Generates one interface per endpoint (requires `Atc.Rest.Client` package):

```csharp
public interface IGetPetByIdEndpoint
{
    Task<GetPetByIdEndpointResult> ExecuteAsync(Guid petId, CancellationToken ct = default);
}

public interface IGetPetsEndpoint
{
    Task<GetPetsEndpointResult> ExecuteAsync(int pageSize = 10, CancellationToken ct = default);
}
```

**Benefits over TypedClient:**
- Inject only the endpoint you need
- Better separation of concerns
- Easier to mock in tests
- Built-in result pattern with typed responses

**DI Registration:**
```csharp
services.AddAtcRestApiClient(options =>
{
    options.BaseAddress = new Uri("https://api.example.com");
});
```

---

## OAuth Token Management

When `generateOAuthTokenManagement: true`, the generator creates:
- Token acquisition and refresh logic
- Token caching
- Automatic header injection
- Support for client credentials and authorization code flows

---

## Error Response Formats

| Format | Description |
|---|---|
| `ProblemDetails` | RFC 7807 structured error responses (recommended) |
| `PlainText` | String error messages with ProblemDetails fallback |
| `PlainTextOnly` | String error messages only |
| `Custom` | User-defined error model (set `customErrorResponseModel`) |

---

## TypeScript Client Details

### ApiService Pattern

The generated `ApiService.ts` is the root orchestrator:

```typescript
import { ApiService } from './ApiService';

const api = new ApiService({ baseUrl: 'https://api.example.com' });
const result = await api.pets.getById('pet-id');

if (result.isSuccess) {
  console.log(result.data); // Pet
} else {
  console.error(result.error); // Error details
}
```

### ApiResult Discriminated Union

Every client method returns an `ApiResult<T>`:

```typescript
type ApiResult<T> =
  | { isSuccess: true; statusCode: number; data: T }
  | { isSuccess: false; statusCode: number; error: ApiError };
```

Type guards for response handling:
```typescript
if (result.isSuccess) {
  // result.data is typed as T
} else {
  // result.error contains error details
}
```

### Fetch vs Axios

**Fetch (default):** No external dependencies, uses native `fetch` API.

**Axios:** Adds `axios` dependency, provides interceptors:

```typescript
const api = new ApiService({
  baseUrl: 'https://api.example.com',
  interceptors: {
    request: (config) => { config.headers['Authorization'] = `Bearer ${token}`; return config; },
    response: (response) => response,
    error: (error) => { /* handle 401 */ },
  },
});
```

### React Query Integration

Setup with `ApiProvider`:
```tsx
import { ApiProvider } from './hooks/ApiProvider';

<ApiProvider baseUrl="https://api.example.com">
  <App />
</ApiProvider>
```

Using hooks:
```tsx
const { data: pets, isLoading, error } = useGetPets();
const { mutate: createPet } = useCreatePet();
```

Query key factories are auto-generated for cache invalidation.

### File Uploads

```typescript
// Single file
const result = await api.pets.uploadPhoto(petId, file);

// File with metadata
const result = await api.documents.upload(file, { description: 'Photo', tags: ['pet'] });
```

### File Downloads

```typescript
const result = await api.documents.download(docId);
if (result.isSuccess) {
  const blob = result.data; // Blob
  const url = URL.createObjectURL(blob);
}
```

### Streaming

```typescript
for await (const pet of api.pets.streamAll({ signal: abortController.signal })) {
  console.log(pet);
}
```

### Webhooks & Real-Time

With SignalR integration:
```typescript
const connection = new HubConnectionBuilder()
  .withUrl('/webhooks/hub')
  .build();

connection.on('PetCreated', (pet: Pet) => { /* handle */ });
```

---

## Interceptors

### Fetch Interceptors

```typescript
const api = new ApiService({
  baseUrl: 'https://api.example.com',
  requestInterceptor: (request) => {
    request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  responseInterceptor: (response) => {
    if (response.status === 401) { /* redirect to login */ }
    return response;
  },
});
```

### Axios Interceptors

```typescript
const api = new ApiService({
  baseUrl: 'https://api.example.com',
  interceptors: {
    request: (config) => { /* modify request */ return config; },
    response: (response) => response,
    error: (error) => { /* handle error */ return Promise.reject(error); },
  },
});
```
