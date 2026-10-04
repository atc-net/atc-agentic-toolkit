# Project v2 Migration — `AddProject` → `AddDotnetProject` (13.6+)

"Project v2" moves .NET services from the legacy `ProjectResource` model (`AddProject<T>`,
`AddProject(name, path)`, `AddCSharpApp`) to `DotnetProjectResource` (`AddDotnetProject`, package
`Aspire.Hosting.Dotnet`). Project v2 resources are launched through the .NET SDK with
executable-based identity, take part in **coordinated restore/build groups**, get per-resource
**Rebuild** commands, and publish through **.NET SDK container publishing**. See
[Polyglot APIs](polyglot-apis.md) for the API surface and [Migration](migration.md) for the 13.6 notes.

> The 13.6 CLI ships an `aspire-project-v2-migration` skill (installed by `aspire agent init` /
> `aspire init`). If it exists in the repo (`.agents/skills/…`, `.claude/skills/…`), follow it — this
> page summarizes the same rules for repos without it.

**Verified on CLI 13.6.0:** `AddDotnetProject(name, path)` and
`AddDotnetProject(name, path, Action<ProjectResourceOptions>)`; `ProjectResourceOptions` has
`LaunchProfileName`, `ExcludeLaunchProfile`, `ExcludeKestrelEndpoints`; TS
`addDotnetProject(name, path, options?: DotnetProjectOptions)` with a **flat** options object;
`AddDotnetProjectBlazorGateway(name)` + `WithBlazorClientApp(...)`; `AddEFMigrations` overloads for
`IDotnetProgramResource`.

---

## 1. Approval boundary

"Migrate to Project v2" authorizes an **assessment only**. Assessment is read-only — no restore,
build, run, package changes, or SDK regeneration. Present a table and end with an explicit approval
question (an unavailable user is not approval):

| Resource | Current API | Proposed replacement | Behavior retained | Package/reference edits | Classification |
|---|---|---|---|---|---|
| `api` | `AddProject<Projects.Api>("api")` | `AddDotnetProject("api", "../Api/Api.csproj")` | endpoints, `WithReference(db)`, `WaitFor(db)` | `+ Aspire.Hosting.Dotnet` | supported / decision / unsupported |

Already-migrated AppHosts, or AppHosts with no matching resources, are a no-op — say so and stop.

## 2. Eligibility gate (stop without edits if it fails)

1. Pick **one exact AppHost** and read its real Aspire version:
   - project AppHost — `Aspire.AppHost.Sdk` / `Aspire.Hosting.AppHost` (incl. central package management);
   - file-based — `#:sdk` / `#:package` directives (and `global.json`);
   - TypeScript — `aspire.config.json` `sdk.version` and the package graph.
2. **Stop** if the version is below 13.6, unresolved, or conflicting (e.g. SDK 13.6 but packages 13.5).
   The CLI version, .NET SDK, service `TargetFramework`s, and neighbouring AppHosts are not evidence.
3. **Never upgrade Aspire implicitly** — that's an `aspire update` decision for the user.
4. Add `Aspire.Hosting.Dotnet` at the version compatible with the AppHost (it is prerelease:
   `13.6.0-preview.*`). Coordinated builds need .NET SDK **11.0.100-rc.1+** (see [Troubleshooting](troubleshooting.md)).
5. TypeScript: if the generated SDK still exposes only the handle-based `ProjectResourceOptions` for
   `addDotnetProject` (no flat `DotnetProjectOptions`), stop — don't invent a fallback API.

**Unsupported or needs a user decision:** Azure Functions projects and unknown `ProjectResource`
subtypes; F# (`.fsproj`) / VB (`.vbproj`) projects (assessment only); direct `new ProjectResource(...)`;
code that consumes `GetProjectResources()`, casts to `ProjectResource`, or uses generic constraints on
it; custom publishers / image managers; extension methods constrained to `ProjectResource`;
file-based apps combined with `WithBuildEnvironment` or the EF CLI; ambiguous path/metadata mapping.

## 3. API mapping

| Legacy | Project v2 |
|---|---|
| `AddProject<Projects.Inventory_Api>("api")` | `AddDotnetProject("api", "../Inventory.Api/Inventory.Api.csproj")` — resolve the real path from the generated `IProjectMetadata.ProjectPath` (honour `AspireProjectMetadataTypeName` overrides); don't guess from the type name |
| `AddProject("api", "../Api")` | `AddDotnetProject("api", "../Api")` — only if the directory contains exactly one `.csproj` |
| `AddCSharpApp("worker", "../Worker/Worker.csproj")` | `AddDotnetProject("worker", "../Worker/Worker.csproj")` (file-based `.cs` apps too — .NET 10+, keep their `#:` directives) |
| TS `addProject('api', '../Api/Api.csproj')` / `addCSharpApp(...)` | `addDotnetProject('api', '../Api/Api.csproj')` |
| `AddBlazorGateway("gateway")` | `AddDotnetProjectBlazorGateway("gateway")` + `.WithBlazorClientApp(client, …)` |

### Launch profiles — omitted ≠ null

```csharp
// C#: named profile
builder.AddProject<Projects.Api>("api", launchProfileName: "https");
builder.AddDotnetProject("api", "../Api/Api.csproj", options => options.LaunchProfileName = "https");

// C#: explicit null means "no launch profile"
builder.AddProject<Projects.Api>("api", launchProfileName: null);
builder.AddDotnetProject("api", "../Api/Api.csproj", options => options.ExcludeLaunchProfile = true);

// C#: omitted means "default profile" → omit the options too
```

```typescript
// TS legacy: addProject('api', path, { launchProfileOrOptions: 'https' })
await builder.addDotnetProject('api', '../Api/Api.csproj', { launchProfileName: 'https' });

// TS: omitted, {}, and launchProfileName: null all select the DEFAULT profile
// (unlike C#, a legacy TS `launchProfileOrOptions: null` does NOT exclude the profile)
await builder.addDotnetProject('api', '../Api/Api.csproj', { excludeLaunchProfile: true }); // no profile
```

- The TS options object is flat — don't nest it under `options`. `excludeLaunchProfile: true` wins
  over a name. Read legacy option handles via `property.get()`, not object spread.
- Carry `ExcludeKestrelEndpoints` / `excludeKestrelEndpoints` only when the legacy code set it. It
  stops Aspire deriving endpoints from the service's Kestrel config; it doesn't change that config.

### Carry forward unchanged

`WithArgs` (and arg callbacks), runtime `WithEnvironment`, endpoints, `WithReference` and endpoint
references, `WaitFor` / `WaitForCompletion`, health checks, `WithReplicas`, relationships, commands,
publishing and container options. Pause for a decision on anything that only compiles against
`ProjectResource`.

### Build vs runtime environment

Keep runtime `WithEnvironment` as is. Add `WithBuildEnvironment(name, value)` (MSBuild-only, `.csproj`
only — not file-based apps, not secrets) only for an established, approved build input. Image name,
tag, and platform go through `WithContainerBuildOptions`, never through build-environment properties.

## 4. Diagnostics

- **No `ASPIREDOTNETPROJECT001` suppression on 13.6.** The diagnostic was removed from
  `AddDotnetProject`, `DotnetProjectResource`, `WithBuildEnvironment`, `AddDotnetProjectBlazorGateway`,
  and its `WithBlazorClientApp` overload (the API reference pages may still show the old annotation —
  the 13.6 diagnostic page is authoritative). Remove existing suppressions; don't add new ones.
- `ASPIREBLAZOR001` still applies to experimental Blazor APIs — keep existing scopes.
- `AddEFMigrations` overloads for `IDotnetProgramResource` are experimental under
  **`ASPIREPROJECTS001`** (the legacy `ProjectResource` overload isn't) — add a narrow paired
  `#pragma warning disable/restore` when switching an EF migration resource to Project v2.
- Legacy `AddCSharpApp` needed `ASPIRECSHARPAPPS001`; drop that suppression once nothing uses it.

## 5. Publishing, Dockerfiles, Blazor, EF

- `AddDotnetProject` resources publish through **.NET SDK container publishing** (13.6). Directly
  constructed resources don't opt in.
- Keep explicit ownership: `PublishAsDockerFile()` + `WithDockerfile(context, dockerfile)` +
  `WithImage(name, tag)` stays as is; a publish-only prebuilt `ContainerImageAnnotation` applied with
  `ResourceAnnotationMutationBehavior.Replace` (and its publish-mode guard) must not gain SDK build/push steps.
- File-based apps keep **Native AOT** — cross-OS publishing needs a target-OS build or explicit
  approval for `PublishAot=false`.
- **Blazor gateway:** `AddDotnetProjectBlazorGateway("gateway").WithBlazorClientApp(client, …)`
  switches gateway publishing from the legacy Dockerfile to SDK publishing. Target framework, base
  image, OS, user, entrypoint, working directory, and ports can all change — list each change and get
  approval. Remove code that only mutated the legacy gateway's `DockerfileBuildAnnotation`; keep
  `WithContainerBuildOptions` and the client publish annotation.
- **EF Core:** keep migration operations, waits, and publish settings. `dotnet-ef` does **not**
  receive `WithBuildEnvironment` or custom MSBuild globals (runtime `WithEnvironment` is no substitute)
  — disclose this. Keep AppHost references that generate migration/startup metadata.
- **Project references:** remove an AppHost `<ProjectReference>` / `#:project` only when it is proven
  to serve only migrated resources. Keep library, EF, Blazor WASM, conditional, and ambiguous edges —
  `ReferenceOutputAssembly="false"` does **not** stop a reference from building.
- Don't promise watch / hot-reload / partial-run improvements as part of the migration.

## 6. Validation

1. Capture a **legacy baseline** first (same toolchain, disposable copy if needed).
2. After the edit:
   ```bash
   aspire start --non-interactive --isolated --apphost <path>
   aspire wait <resource> --apphost <path> --non-interactive
   aspire describe --apphost <path> --include-hidden --format Json --non-interactive
   aspire stop --apphost <path>
   ```
   No `dotnet run`, no manual HTTP polling. Compare identity, source, launch profile, env, endpoints,
   references/waits, replicas, build, and publish settings against the baseline.
3. Publish checks are separate stages: `aspire publish -o <dir>` → `aspire do build`. Deployment needs
   its own authorization; `aspire publish` alone doesn't prove an image was built. Note that
   `--list-steps` still builds the AppHost (unless `--no-build`), so don't use it during the read-only assessment.
4. Re-run the assessment — it must be idempotent (no duplicate packages, resources, suppressions, or
   options).
5. On failure, report the exact failing step and keep the user's edits. Never fabricate a fallback API
   or disable AOT to make a check pass.
