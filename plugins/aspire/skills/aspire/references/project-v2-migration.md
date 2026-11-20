# Project v2 Migration — `AddProject` → `AddDotnetProject` (13.6+, default in 17.0)

"Project v2" moves .NET services from the legacy `ProjectResource` model (`AddProject<T>`,
`AddProject(name, path)`, `AddCSharpApp`) to `DotnetProjectResource` (`AddDotnetProject`, package
`Aspire.Hosting.Dotnet`). Project v2 resources are launched through the .NET SDK with
executable-based identity, take part in **coordinated restore/build groups**, get per-resource
**Rebuild** commands, and publish through **.NET SDK container publishing**. See
[Polyglot APIs](polyglot-apis.md) for the API surface and [Migration](migration.md) for the 13.6 and 17.0 notes.

> This page is the complete migration procedure — it covers the rules of Microsoft's
> `aspire-project-v2-migration` skill, so you don't need that skill (or its plugin) installed.

### What changed in 17.0

- **`Aspire.Hosting.Dotnet` is stable** (follows the normal 17.0.0 versioning — no more
  `13.6.0-preview.*`) and supports SDK-style **C#, F#, and VB** projects plus file-based C# apps.
- **`AddProject` is deprecated** and **`AddCSharpApp` / `addCSharpApp` are `[Obsolete]`** (`CS0618`,
  replacing `ASPIRECSHARPAPPS001`). Both still work — deprecation is a reason to *offer* the migration,
  not to perform it unasked.
- **New templates already use Project v2:** `Microsoft.NET.Sdk` + `Aspire.Hosting.AppHost` +
  `Aspire.Hosting.Dotnet` package references and `AddDotnetProject("name", "../X/X.csproj")` calls.
- **`Aspire.AppHost.Sdk` is obsolete (`ASPIRE012`)** — and the SDK is what turns `ProjectReference`s into
  `Projects.*` types. Moving a 17.0 AppHost off the SDK therefore *is* a Project v2 migration (see
  [§ 7](#7-moving-off-aspireapphostsdk-170)).
- **No .NET 11 SDK requirement** — a 17.0 AppHost with `AddDotnetProject` builds and publishes with the
  .NET 10 SDK (verified on 10.0.404).
- **`aspire run --watch` doesn't support `AddDotnetProject` yet** — tell the user; use the resource's
  Rebuild command (`aspire resource <name> rebuild`) instead.
- **Visual Studio "Enlist in Aspire orchestration"** may still emit `AddProject<TProject>`, which fails
  with `CS0234` on a Project v2 AppHost (no generated `Projects` type). Fix: `aspire add Aspire.Hosting.Dotnet`
  from the AppHost directory, then `builder.AddDotnetProject("webapplication1", "../WebApplication1/WebApplication1.csproj")`.

**Verified on CLI 13.6.0 (unchanged in 17.0 templates):** `AddDotnetProject(name, path)` and
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
   - project AppHost — `Aspire.AppHost.Sdk` version / `Aspire.Hosting.AppHost` package (incl. central package management);
   - file-based — `#:sdk` / `#:package` directives (and `global.json`; 17.0 file-based AppHosts have only `#:package`);
   - TypeScript — `aspire.config.json` `sdk.version` and the package graph.
2. **Stop** if the version is below 13.6, unresolved, or conflicting (e.g. SDK 13.6 but packages 13.5).
   The CLI version, .NET SDK, service `TargetFramework`s, and neighbouring AppHosts are not evidence.
3. **Never upgrade Aspire implicitly** — that's an `aspire update` decision for the user.
4. Add `Aspire.Hosting.Dotnet` at the **same version as the AppHost** — `17.0.0` on 17.0 (stable);
   on 13.6 it is prerelease (`13.6.0-preview.*`) and coordinated builds need .NET SDK **11.0.100-rc.1+**
   (see [Troubleshooting](troubleshooting.md)).
5. TypeScript: if the generated SDK still exposes only the handle-based `ProjectResourceOptions` for
   `addDotnetProject` (no flat `DotnetProjectOptions`), stop — don't invent a fallback API.

**Unsupported or needs a user decision:** Azure Functions projects and unknown `ProjectResource`
subtypes; F# (`.fsproj`) / VB (`.vbproj`) projects on 13.6 (assessment only — supported from 17.0);
direct `new ProjectResource(...)`;
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

- **No `ASPIREDOTNETPROJECT001` suppression on 13.6 or 17.0.** The diagnostic was removed from
  `AddDotnetProject`, `DotnetProjectResource`, `WithBuildEnvironment`, `AddDotnetProjectBlazorGateway`,
  and its `WithBlazorClientApp` overload (the API reference pages may still show the old annotation —
  the 13.6 diagnostic page is authoritative). Remove existing suppressions; don't add new ones.
- `ASPIREBLAZOR001` still applies to experimental Blazor APIs — keep existing scopes.
- `AddEFMigrations` overloads for `IDotnetProgramResource` are experimental under
  **`ASPIREPROJECTS001`** (the legacy `ProjectResource` overload isn't) — add a narrow paired
  `#pragma warning disable/restore` when switching an EF migration resource to Project v2.
- Legacy `AddCSharpApp` needed `ASPIRECSHARPAPPS001` (13.x) and reports `CS0618` in 17.0; drop those
  suppressions once nothing uses it. `AddProject` calls left in place on 17.0 may also report obsoletion
  warnings — keep any `CS0618` suppression narrow and paired.
- **`ASPIRE012`** (17.0) — obsolete `Aspire.AppHost.Sdk`. Suppress temporarily with
  `<SuppressAspireAppHostSdkObsoleteWarning>true</SuppressAspireAppHostSdkObsoleteWarning>` only if the
  user defers the SDK move.

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

## 7. Moving off `Aspire.AppHost.Sdk` (17.0)

Same approval boundary as § 1 — assess, show the plan, then edit. `aspire update` doesn't do this and
`aspire update --migrate` only reports it.

**Project AppHost** — before → after:

```xml
<!-- Before (13.x / legacy SDK) -->
<Project Sdk="Aspire.AppHost.Sdk/13.6.0">
  <ItemGroup>
    <ProjectReference Include="..\Api\Api.csproj" />
  </ItemGroup>
</Project>

<!-- After (17.0, what `aspire new aspire-starter` generates) -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <UserSecretsId>…keep the existing value…</UserSecretsId>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Aspire.Hosting.AppHost" Version="17.0.0" />
    <PackageReference Include="Aspire.Hosting.Dotnet" Version="17.0.0" />
  </ItemGroup>
</Project>
```

1. Change `Sdk="Aspire.AppHost.Sdk/…"` to `Sdk="Microsoft.NET.Sdk"`; keep `OutputType`, the target
   framework (`net10.0`+), `UserSecretsId`, and other properties.
2. Add `PackageReference`s for `Aspire.Hosting.AppHost` and `Aspire.Hosting.Dotnet` (with central package
   management, add `PackageVersion` entries instead of inline versions).
3. Replace every resource `AddProject<Projects.X>(…)` with `AddDotnetProject(name, path)` using the mapping
   in § 3, then remove only the `ProjectReference`s that served those resources (§ 5 rules). Without the
   SDK, `Projects.*` types are no longer generated, so any remaining `AddProject<Projects.X>` fails to
   compile — all of them must move in the same change.
4. Remove `AspireUseCliBundle` (17.0 requires the CLI bundle) and any `ASPIRE012` suppression.
5. Validate as in § 6.

**File-based AppHost** — replace `#:sdk Aspire.AppHost.Sdk@<version>` with
`#:package Aspire.Hosting.AppHost@17.0.0` and add `#:package Aspire.Hosting.Dotnet@17.0.0`; drop
`#:property AspireUseCliBundle=true`; keep the other `#:package` lines on the same 17.0.0 version.
