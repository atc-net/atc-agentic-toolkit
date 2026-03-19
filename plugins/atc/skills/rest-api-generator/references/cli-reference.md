# CLI Reference

The `atc-rest-api-gen` CLI tool provides scaffolding, validation, TypeScript generation, and migration capabilities.

---

## Installation

```bash
dotnet tool install -g atc-rest-api-gen
```

---

## Command Tree

```
atc-rest-api-gen
├── validate
│   └── schema          Validate an OpenAPI specification
├── generate
│   ├── server          Generate server project(s) from OpenAPI spec
│   ├── client          Generate C# client from OpenAPI spec
│   └── client-typescript  Generate TypeScript client from OpenAPI spec
├── options
│   ├── create          Create an ApiGeneratorOptions.json config file
│   └── validate        Validate an existing options file
└── migrate
    ├── validate        Validate project for migration readiness
    └── execute         Execute migration from old generator
```

---

## validate schema

Validate an OpenAPI specification file.

```bash
atc-rest-api-gen validate schema \
  --specificationPath PetStore.yaml \
  [--no-strict]
```

| Option | Description |
|---|---|
| `--specificationPath`, `-s` | Path to OpenAPI YAML/JSON file (required) |
| `--no-strict` | Use Standard validation instead of Strict |

---

## generate server

Generate a complete server project from an OpenAPI spec.

```bash
atc-rest-api-gen generate server \
  --specificationPath PetStore.yaml \
  --outputPath ./src \
  --projectName MyApi \
  [--projectStructure ThreeProjects] \
  [--aspire]
```

### Common Options

| Option | Description | Default |
|---|---|---|
| `-s`, `--specificationPath` | OpenAPI spec file (required) | — |
| `-o`, `--outputPath` | Output directory (required) | — |
| `-n`, `--projectName` | Project name (required) | — |
| `--projectStructure` | `SingleProject`, `TwoProjects`, `ThreeProjects` | `ThreeProjects` |
| `--aspire` | Add Aspire orchestration support | `false` |

### Server-Specific Options

| Option | Description | Default |
|---|---|---|
| `--useMinimalApiPackage` | Use Atc.Rest.MinimalApi | `Auto` |
| `--useValidationFilter` | Add validation filter | `Auto` |
| `--useGlobalErrorHandler` | Add global error handler | `Auto` |
| `--versioningStrategy` | `None`, `QueryString`, `UrlSegment`, `Header` | `None` |

### Scaffolding Options

| Option | Description |
|---|---|
| `--force` | Overwrite existing files |
| `--dry-run` | Preview without writing files |
| `--verbose` | Detailed output |

---

## generate client

Generate a C# HTTP client from an OpenAPI spec.

```bash
atc-rest-api-gen generate client \
  --specificationPath PetStore.yaml \
  --outputPath ./src/MyApi.Client \
  --projectName MyApi.Client \
  [--generationMode TypedClient]
```

| Option | Description | Default |
|---|---|---|
| `-s`, `--specificationPath` | OpenAPI spec file (required) | — |
| `-o`, `--outputPath` | Output directory (required) | — |
| `-n`, `--projectName` | Project name (required) | — |
| `--generationMode` | `TypedClient` or `EndpointPerOperation` | `TypedClient` |
| `--clientSuffix` | Client class name suffix | `Client` |

---

## generate client-typescript

Generate a TypeScript client from an OpenAPI spec.

```bash
atc-rest-api-gen generate client-typescript \
  --specificationPath PetStore.yaml \
  --outputPath ./src/ts-client \
  [options]
```

### Core Options

| Option | Description | Default |
|---|---|---|
| `-s`, `--specificationPath` | OpenAPI spec file (required) | — |
| `-o`, `--outputPath` | Output directory (required) | — |

### Type Options

| Option | Description | Default |
|---|---|---|
| `--enum-style` | `union` (string literals) or `enum` (TypeScript enums) | `union` |
| `--client-type` | `fetch` or `axios` | `fetch` |
| `--naming` | `CamelCase`, `Original`, `PascalCase` | `CamelCase` |
| `--convert-dates` | Convert date strings to Date objects | `false` |
| `--readonly` | Generate readonly model properties | `false` |

### Framework Options

| Option | Description | Default |
|---|---|---|
| `--hooks` | `none` or `react-query` | `none` |
| `--zod` | Generate Zod validation schemas | `false` |

### Scaffolding Options

| Option | Description | Default |
|---|---|---|
| `--scaffold` | Generate package.json and tsconfig.json | `false` |
| `--package` | NPM package name (with `--scaffold`) | auto |

### Output Options

| Option | Description |
|---|---|
| `--dry-run` | Preview without writing |
| `--watch` | Regenerate on spec changes |
| `--report` | Show generation statistics |
| `--validation` | Validate spec before generating |
| `--verbose` | Detailed output |

### Generated Output Structure

```
ts-client/
├── client/              # HTTP client implementations
├── models/              # TypeScript interfaces
├── enums/               # Enum types or union types
├── errors/              # Error types
├── types/               # Shared types
├── hooks/               # React Query hooks (if --hooks react-query)
├── schemas/             # Zod schemas (if --zod)
├── ApiService.ts        # Root service orchestrator
├── package.json         # (if --scaffold)
└── tsconfig.json        # (if --scaffold)
```

### React Query Hooks

When `--hooks react-query` is specified, generates hooks wrapping each endpoint:

```typescript
// Auto-generated hook
export const useGetPets = (options?: UseQueryOptions<Pet[]>) =>
  useQuery({ queryKey: petKeys.list(), queryFn: () => apiService.pets.getAll(), ...options });

// Usage in component
const { data: pets, isLoading } = useGetPets();
```

### Zod Schemas

When `--zod` is specified, generates Zod schemas from OpenAPI constraints:

```typescript
export const PetSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100),
  status: z.enum(['available', 'pending', 'sold']),
});
```

### Type Mapping

| OpenAPI Type | TypeScript Type |
|---|---|
| `string` | `string` |
| `integer` / `number` | `number` |
| `boolean` | `boolean` |
| `string` + `date` / `date-time` | `string` (or `Date` with `--convert-dates`) |
| `string` + `binary` | `Blob` |
| `array` | `T[]` |
| `object` | Interface |

---

## options create / validate

```bash
# Create options file
atc-rest-api-gen options create --outputPath ./ApiGeneratorOptions.json

# Validate options file
atc-rest-api-gen options validate --optionsPath ./ApiGeneratorOptions.json
```

---

## migrate validate / execute

Migrate from the deprecated `atc-rest-api-generator` CLI.

```bash
# Check migration readiness
atc-rest-api-gen migrate validate --projectPath ./src

# Dry run
atc-rest-api-gen migrate execute --projectPath ./src --dry-run

# Execute migration
atc-rest-api-gen migrate execute --projectPath ./src
```

### What Migration Changes

- Renames projects to new naming conventions
- Creates marker files from old configuration
- Updates namespaces throughout the codebase
- Migrates parameter names
- Removes deprecated files and references

### Rollback

```bash
git reset --hard HEAD~1
```

---

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | General error |
| 2 | Validation failure |
| 3 | File I/O error |
