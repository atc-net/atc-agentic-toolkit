---
name: typescript-conventions
description: 'Best practices and conventions for TypeScript and React development, covering type safety, interfaces, discriminated unions, strict mode, functional components, hooks, state management, CSS modules, and project tooling. Apply this skill whenever writing, reviewing, or refactoring TypeScript (.ts/.tsx) files, React components, custom hooks, or TypeScript configuration -- even if the user does not explicitly mention "TypeScript conventions." Also apply when the user discusses type safety, React component patterns, hook rules, prop drilling, or frontend architecture in a TypeScript context.'
user-invocable: false
---

# TypeScript and React Conventions

Apply these practices when writing, reviewing, or refactoring TypeScript and React code. The goal is type-safe, readable, maintainable code that leverages TypeScript's type system and React's component model effectively.

## TypeScript Fundamentals

### Strict Mode

Enable strict mode in `tsconfig.json`. Strict mode activates a family of checks (`strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, etc.) that catch real bugs at compile time rather than at runtime. Treat compiler errors as helpful feedback, not obstacles.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- `noUncheckedIndexedAccess` makes array/object index access return `T | undefined`, which prevents a common source of runtime crashes
- `exactOptionalPropertyTypes` distinguishes between "missing property" and "property set to undefined"

### Avoid `any`

The `any` type disables type checking entirely for that value, which defeats the purpose of using TypeScript. When the type is genuinely unknown, use `unknown` instead -- it forces you to narrow the type before using it, which makes the code safer without losing flexibility.

```typescript
// Problematic: silently passes through without any checking
function processInput(data: any) {
  return data.name.toUpperCase(); // runtime crash if data has no name
}

// Better: forces you to verify the shape before using it
function processInput(data: unknown): string {
  if (typeof data === "object" && data !== null && "name" in data) {
    return String((data as { name: unknown }).name).toUpperCase();
  }
  throw new Error("Invalid input: expected object with name property");
}
```

If migrating a codebase and `any` is temporarily unavoidable, mark it with a comment explaining why and when it can be removed (e.g., `// TODO: type properly after API types are generated`).

### Type Inference and Explicit Types

TypeScript's inference is powerful -- let it work for you inside function bodies. Add explicit types at boundaries where they serve as documentation and contracts.

```typescript
// Let inference handle local variables
const items = [1, 2, 3]; // TypeScript knows this is number[]
const doubled = items.map((x) => x * 2); // inferred as number[]

// Be explicit at function boundaries -- this is the contract callers depend on
function calculateTotal(items: ReadonlyArray<CartItem>): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Be explicit for exported constants and module-level state
export const MAX_RETRIES: number = 3;
```

The reasoning: inference inside functions reduces noise and adapts automatically when code changes. Explicit types at boundaries catch contract-breaking changes at the call site rather than deep in the implementation.

### Interfaces and Type Aliases

Use interfaces for data structures and object shapes. They are extendable, produce clearer error messages, and express intent well. Use type aliases for unions, intersections, mapped types, and utility types.

```typescript
// Interface for data structures -- clearly describes a shape
interface User {
  readonly id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Interface for service contracts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Type alias for unions and composed types
type UserRole = "admin" | "editor" | "viewer";
type AsyncResult<T> = { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: Error };
```

### Discriminated Unions

Discriminated unions model state that can only be in one configuration at a time. This is much safer than having multiple optional fields that can get out of sync, because the compiler enforces exhaustive handling.

```typescript
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function renderState<T>(state: RequestState<T>): string {
  switch (state.status) {
    case "idle":
      return "Ready";
    case "loading":
      return "Loading...";
    case "success":
      return `Got ${String(state.data)}`;
    case "error":
      return `Failed: ${state.error.message}`;
  }
}
```

If you add a new variant to the union, the compiler will flag every switch/if-chain that doesn't handle it -- this is the key advantage over stringly-typed status fields with separate optional properties.

### Immutability

Use `const` for all bindings by default. Use `readonly` for properties that should not change after construction. Use `ReadonlyArray<T>` or `readonly T[]` for arrays that should not be mutated. Immutable data is easier to reason about, especially in React where mutation can silently break rendering.

```typescript
interface Config {
  readonly apiUrl: string;
  readonly maxRetries: number;
  readonly features: ReadonlyArray<string>;
}

// as const narrows literal types and makes everything readonly
const ROUTES = {
  home: "/",
  profile: "/profile",
  settings: "/settings",
} as const;

// typeof ROUTES.home is "/", not string
type Route = (typeof ROUTES)[keyof typeof ROUTES];
```

### Optional Chaining and Nullish Coalescing

Use optional chaining (`?.`) to safely access nested properties that might be null or undefined. Use nullish coalescing (`??`) to provide defaults only when a value is `null` or `undefined` -- unlike `||`, it does not treat `0`, `""`, or `false` as missing.

```typescript
// Optional chaining -- short-circuits to undefined if any link is null/undefined
const city = user?.address?.city;
const firstTag = post?.tags?.[0];
const formatted = date?.toISOString?.();

// Nullish coalescing -- only substitutes for null/undefined
const pageSize = config.pageSize ?? 20; // 0 is a valid page size, not replaced
const label = item.label ?? "Untitled"; // empty string "" would be kept
```

### Utility Types

TypeScript ships with utility types that derive new types from existing ones. Prefer these over manually duplicating type definitions.

```typescript
// Pick and Omit for selecting/excluding properties
type UserSummary = Pick<User, "id" | "name">;
type CreateUserInput = Omit<User, "id" | "createdAt">;

// Partial and Required for adjusting optionality
type UserUpdate = Partial<User>;
type StrictConfig = Required<Config>;

// Record for typed key-value maps
type FeatureFlags = Record<string, boolean>;

// Extract and Exclude for filtering union members
type SuccessState = Extract<RequestState<unknown>, { status: "success" }>;
```

### Async/Await

Use `async`/`await` instead of raw `.then()` chains. It reads sequentially, makes error handling straightforward with try/catch, and avoids deeply nested callbacks.

```typescript
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
  }
  const data: unknown = await response.json();
  return parseUserProfile(data);
}

// Parallel execution when requests are independent
async function loadDashboard(userId: string): Promise<DashboardData> {
  const [profile, notifications, activity] = await Promise.all([
    fetchUserProfile(userId),
    fetchNotifications(userId),
    fetchRecentActivity(userId),
  ]);
  return { profile, notifications, activity };
}
```

Handle errors at appropriate boundaries rather than swallowing them silently. Let errors propagate to a place where they can be meaningfully handled (error boundaries in React, global error handlers in APIs).

### Enums vs. Union Types

Prefer string literal union types over enums. They produce no runtime JavaScript, work naturally with type narrowing, and are compatible with JSON serialization.

```typescript
// Prefer this
type Status = "active" | "inactive" | "pending";

// Over this -- enums generate runtime code and can behave unexpectedly with reverse mapping
enum Status {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
}
```

If you need runtime iteration over the values, use `as const` with an array:

```typescript
const STATUSES = ["active", "inactive", "pending"] as const;
type Status = (typeof STATUSES)[number];
// Now STATUSES is iterable and Status is the union type
```

## React Conventions

### Functional Components

Use functional components exclusively. Class components are legacy -- they introduce extra complexity without benefits in modern React.

```typescript
interface UserCardProps {
  user: User;
  onSelect: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => {
  return (
    <div className={styles.card} onClick={() => onSelect(user.id)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
};
```

Alternatively, type the function directly if you do not need the implicit `children` typing that `React.FC` provides:

```typescript
function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div className={styles.card} onClick={() => onSelect(user.id)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

### Component Design Principles

- **Single responsibility**: Each component should do one thing well. If a component handles data fetching, formatting, and display, split it into a container (data) and a presentational component (display).
- **Small surface area**: Keep the props interface minimal. If a component accepts more than 5-6 props, consider whether it is doing too much or whether some props should be grouped into an object.
- **Composition over configuration**: Instead of a single component with many boolean flags, compose smaller components together.

```typescript
// Instead of this -- too many configuration flags
<DataTable sortable filterable paginated exportable collapsible />

// Compose smaller focused components
<DataTable data={data}>
  <SortableHeader />
  <FilterBar />
  <Pagination />
</DataTable>
```

### Hooks Rules

React hooks have two rules enforced by the `react-hooks/rules-of-hooks` ESLint rule. These rules exist because React relies on hook call order being identical between renders to track state correctly.

1. **Call hooks at the top level** -- never inside conditions, loops, or nested functions.
2. **Call hooks only from React functions** -- components or custom hooks, not plain utility functions.

```typescript
// Correct: hooks called unconditionally at the top level
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchUser(userId).then((data) => {
      if (!cancelled) {
        setUser(data);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (isLoading) return <Spinner />;
  if (!user) return <NotFound />;
  return <UserCard user={user} />;
}
```

### Dependency Arrays

The dependency array in `useEffect`, `useMemo`, and `useCallback` tells React when to re-run the effect or recalculate the value. Getting dependencies wrong causes either stale closures (missing dependencies) or infinite re-render loops (unstable references).

```typescript
// useEffect: re-runs when userId changes
useEffect(() => {
  loadUser(userId);
}, [userId]);

// useMemo: recalculates only when items or filter change
const filteredItems = useMemo(
  () => items.filter((item) => item.category === filter),
  [items, filter]
);

// useCallback: stable function reference for child components
const handleSubmit = useCallback(
  (data: FormData) => {
    submitForm(data, userId);
  },
  [userId]
);
```

Use the `react-hooks/exhaustive-deps` ESLint rule. If it flags a dependency you think should be excluded, the fix is almost always to restructure the code, not to suppress the warning.

### Custom Hooks

Extract reusable stateful logic into custom hooks. This keeps components focused on rendering while making the logic testable in isolation.

```typescript
function useAsync<T>(asyncFn: () => Promise<T>, deps: readonly unknown[]): RequestState<T> {
  const [state, setState] = useState<RequestState<T>>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    asyncFn().then(
      (data) => { if (!cancelled) setState({ status: "success", data }); },
      (error) => { if (!cancelled) setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) }); }
    );

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// Usage -- the component is clean and focused on rendering
function UserList() {
  const state = useAsync(() => fetchUsers(), []);

  if (state.status === "loading") return <Spinner />;
  if (state.status === "error") return <ErrorMessage error={state.error} />;
  if (state.status === "success") return <List items={state.data} />;
  return null;
}
```

Naming convention: custom hooks always start with `use` (e.g., `useAuth`, `useLocalStorage`, `useDebounce`). This is not just a convention -- React's linter uses the prefix to identify hooks and enforce the rules.

### CSS Modules

Use CSS modules for component-scoped styling. They prevent class name collisions by generating unique names at build time, without the runtime cost of CSS-in-JS.

```typescript
import styles from "./UserCard.module.css";

function UserCard({ user }: UserCardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{user.name}</h3>
      <span className={styles.role}>{user.role}</span>
    </div>
  );
}
```

```css
/* UserCard.module.css */
.card {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.name {
  font-weight: 600;
  margin: 0;
}

.role {
  color: var(--text-secondary);
  font-size: 0.875rem;
}
```

For conditional class names, compose them with template literals or a small utility rather than a heavy library:

```typescript
<div className={`${styles.card} ${isActive ? styles.active : ""}`}>
```

### State Management and Prop Drilling

When multiple components need the same data, avoid passing props through many intermediate layers (prop drilling). Choose the appropriate tool based on scope:

- **Local state** (`useState`): state used by a single component or its direct children.
- **Context** (`useContext`): state shared across a subtree that changes infrequently (theme, locale, auth).
- **External state library** (Zustand, Jotai, Redux Toolkit): state that is complex, changes frequently, or needs to be accessed by many unrelated components.

```typescript
// Context for shared, infrequently-changing state
interface AuthContext {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

function useAuth(): AuthContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

The throw-if-null pattern above gives a clear error message when a component forgets to wrap its tree with the provider, rather than silently getting `undefined` values.

### Error Boundaries

React error boundaries catch JavaScript errors in the component tree and display a fallback UI instead of crashing the entire application. Since there is no hook equivalent, use a class component (this is one of the few valid uses) or a library like `react-error-boundary`.

```typescript
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Wrap sections of the UI independently so one failure does not take down the whole page
function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Header />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MainContent />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

### List Rendering and Keys

When rendering lists, provide a stable, unique `key` prop so React can efficiently reconcile the list when items are added, removed, or reordered. Array indices are not stable keys if the list can change.

```typescript
// Good: stable unique identifier
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}

// Avoid: index keys break when list order changes
{users.map((user, index) => (
  <UserCard key={index} user={user} />
))}
```

### Memoization

Use `React.memo`, `useMemo`, and `useCallback` to avoid expensive re-computations and unnecessary re-renders. Apply them when profiling shows a performance problem, not preemptively everywhere -- memoization has its own memory cost.

```typescript
// Memoize a component that receives the same props frequently
const ExpensiveChart = React.memo(function ExpensiveChart({ data }: ChartProps) {
  return <canvas>{/* complex rendering */}</canvas>;
});

// Memoize an expensive computation
const sortedData = useMemo(
  () => data.slice().sort((a, b) => a.score - b.score),
  [data]
);

// Stable callback reference for child that uses React.memo
const handleClick = useCallback((id: string) => {
  dispatch({ type: "SELECT", payload: id });
}, [dispatch]);
```

## Project Tooling and Organization

### ESLint and Prettier

Use ESLint for code quality rules and Prettier for formatting. Configure them to not conflict with each other.

Recommended ESLint config for TypeScript + React projects:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

`prettier` in the `extends` array disables all ESLint formatting rules so only Prettier handles formatting. This eliminates conflicts between the two tools.

### Barrel Exports

Use `index.ts` barrel files to provide clean import paths and control the public API of each module.

```typescript
// components/UserCard/index.ts
export { UserCard } from "./UserCard";
export type { UserCardProps } from "./UserCard";

// Now consumers import from the folder, not the file
import { UserCard } from "@/components/UserCard";
```

Keep barrel files shallow -- re-export only the public API. Deep barrel chains (barrels importing from other barrels) can create circular dependencies and slow down build tools.

### File and Directory Structure

Organize by feature rather than by type when the project grows beyond a handful of components. Feature-based organization keeps related code together.

```
src/
  features/
    auth/
      components/
        LoginForm.tsx
        LoginForm.module.css
      hooks/
        useAuth.ts
      types.ts
      index.ts
    dashboard/
      components/
      hooks/
      types.ts
      index.ts
  shared/
    components/
    hooks/
    utils/
    types/
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| CSS modules | PascalCase matching component | `UserCard.module.css` |
| Test files | Same name with `.test` suffix | `UserCard.test.tsx` |

## Common Pitfalls

| Pitfall | Why it matters | What to do instead |
|---------|---------------|-------------------|
| Using `any` to silence errors | Hides real type problems that surface as runtime bugs | Use `unknown` and narrow, or define proper types |
| Missing dependency array entries | Stale closures cause bugs that are difficult to reproduce | Trust the `exhaustive-deps` lint rule |
| Mutating state directly | React will not detect the change and will skip re-rendering | Create new objects/arrays: spread, `map`, `filter` |
| Defining components inside components | Creates a new component identity every render, destroying state | Move inner components outside or use `useMemo` for render functions |
| Huge monolithic components | Hard to test, hard to reuse, hard to reason about | Extract custom hooks and sub-components |
| Index keys on dynamic lists | Causes incorrect DOM reuse when items are reordered or removed | Use stable unique IDs from data |
| Over-memoizing everything | Adds complexity and memory overhead without measurable benefit | Profile first, memoize where it matters |
| Ignoring TypeScript errors | Accumulates tech debt; `@ts-ignore` spreads silently | Fix the root cause; use `@ts-expect-error` with a reason if suppression is truly needed |
