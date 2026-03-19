# Server Generation Reference

Comprehensive guide to server-side code generation patterns and OpenAPI conventions.

---

## Basic Patterns

### Return 200 with Single Item

```yaml
paths:
  /pets/{petId}:
    get:
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          description: Not Found
```

Generates handler interface:
```csharp
public interface IGetPetByIdHandler
{
    Task<GetPetByIdResult> ExecuteAsync(Guid petId, CancellationToken cancellationToken);
}
```

### Return 200 with List and Pagination

```yaml
paths:
  /pets:
    get:
      operationId: getPets
      parameters:
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 10
        - name: continuationToken
          in: query
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedPetResult'
```

### IAsyncEnumerable Streaming

```yaml
paths:
  /pets/stream:
    get:
      operationId: streamPets
      x-return-async-enumerable: true
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
```

### POST with Request Body

```yaml
paths:
  /pets:
    post:
      operationId: createPet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePetRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          description: Bad Request
```

---

## Response Patterns

### 201 Created

```yaml
responses:
  '201':
    description: Created
    headers:
      Location:
        schema:
          type: string
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Pet'
```

### 204 No Content

```yaml
responses:
  '204':
    description: No Content
```

---

## File Operations

### File Upload (Single)

```yaml
requestBody:
  content:
    multipart/form-data:
      schema:
        type: object
        properties:
          file:
            type: string
            format: binary
```

### File Upload with Metadata

```yaml
requestBody:
  content:
    multipart/form-data:
      schema:
        type: object
        properties:
          file:
            type: string
            format: binary
          description:
            type: string
          tags:
            type: array
            items:
              type: string
```

### File Download

```yaml
responses:
  '200':
    description: OK
    content:
      application/octet-stream:
        schema:
          type: string
          format: binary
```

---

## Advanced Types

### Enum Types

```yaml
components:
  schemas:
    PetStatus:
      type: string
      enum:
        - available
        - pending
        - sold
```

### Polymorphic Types (oneOf)

```yaml
components:
  schemas:
    Animal:
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      discriminator:
        propertyName: animalType
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
```

### Nullable Object References (allOf)

```yaml
properties:
  owner:
    allOf:
      - $ref: '#/components/schemas/Person'
    nullable: true
```

### Dictionary Types (additionalProperties)

```yaml
properties:
  metadata:
    type: object
    additionalProperties:
      type: string
```

Generates: `Dictionary<string, string>`

---

## Type-Safe Result Pattern

Every operation generates a strongly-typed result class:

```csharp
public class GetPetByIdResult : ResultBase
{
    // Factory methods for each possible response
    public static GetPetByIdResult Ok(Pet pet) => new(200, pet);
    public static GetPetByIdResult NotFound(string? message = null) => new(404, message);

    // Private constructor enforces use of factory methods
    private GetPetByIdResult(int statusCode, object? value = null) : base(statusCode, value) { }
}
```

Handlers must return this exact type — compile-time safety for all response codes.

---

## Validation Modes

### Standard Mode
- Basic OpenAPI structure validation
- Type checking
- Required fields

### Strict Mode (recommended)
- All Standard validations plus:
- Operation titles required
- PascalCase naming conventions enforced
- Description requirements
- Security scheme validation
- Schema completeness checks

---

## Type Mapping

| OpenAPI Type + Format | C# Type |
|---|---|
| `string` | `string` |
| `string` + `uuid` | `Guid` |
| `string` + `date` | `DateOnly` |
| `string` + `date-time` | `DateTimeOffset` |
| `string` + `uri` | `Uri` |
| `string` + `email` | `string` |
| `string` + `binary` | `IFormFile` (upload) / `byte[]` (download) |
| `integer` + `int32` | `int` |
| `integer` + `int64` | `long` |
| `number` + `float` | `float` |
| `number` + `double` | `double` |
| `number` + `decimal` | `decimal` |
| `boolean` | `bool` |
| `array` | `List<T>` |
| `object` | Generated class |

## Parameter Location Mapping

| OpenAPI `in` | C# Attribute |
|---|---|
| `path` | `[FromRoute]` |
| `query` | `[FromQuery]` |
| `header` | `[FromHeader]` |
| `cookie` | `[FromCookie]` |
