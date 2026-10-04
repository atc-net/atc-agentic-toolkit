---
name: dataverse-overview
description: >
  Background orientation for Microsoft Dataverse work: the dataverse skill map,
  hard rules, tool-capability matrix (MCP, Python SDK, dataverse CLI, PAC CLI,
  Azure CLI, GitHub CLI, Web API), SDK method cheat-sheet, and the safe change lifecycle.
  Load first for any Dataverse task, alongside the matching specialist dataverse-* skill.
  USE FOR: Dataverse, Dynamics 365, Dynamics 365 Customer Engagement, CRM, Power Platform,
  Power Apps model-driven apps, choosing between MCP / SDK / CLI / PAC, environment
  confirmation, solution-first changes, pulling solutions to the repo.
  DO NOT USE FOR: canvas apps, Power Automate flows, Business Central.
user-invocable: false
---

# Dataverse Overview

Cross-cutting context for every Dataverse task: what the dataverse skills cover, the non-negotiable rules, which tool can do what, and how to change an environment safely. This skill does not route — specialist skills are selected by their own descriptions. Users describe the outcome in plain language; chain the skills yourself and never ask the user to name a skill or command.

---

## Skill map

| Area | Skill |
| --- | --- |
| Connect, authenticate, configure MCP, verify the environment | `dataverse-connect` |
| Schema — tables, columns, relationships, forms, views; inspect existing schema | `dataverse-metadata` |
| Data writes — record CRUD, bulk create/update/upsert, CSV and FK-ordered import, sample data | `dataverse-data` |
| Data reads and analytics — OData, QueryBuilder, FetchXML (aggregates, N:N joins), DataFrames | `dataverse-query` |
| Solution ALM — create, export, import, pack/unpack, post-import validation | `dataverse-solution` |
| Environment administration — bulk delete, retention/archival, org and OrgDB settings, recycle bin | `dataverse-admin` |
| Security and access — roles, users, application users, business units, self-elevation | `dataverse-security` |
| Orientation — rules, tool matrix, change lifecycle (this skill) | `dataverse-overview` |

**Model-driven apps:** the building blocks (tables, forms, views) live in `dataverse-metadata`. Composing the app shell itself (site map, navigation) is not covered by a dedicated skill.

**Out of scope:**

- **Canvas apps** — different technology; use `pac canvas` or the maker portal
- **Power Automate flows** — use the maker portal or the Power Automate Management API
- **Azure infrastructure** beyond what a service principal needs
- **Business Central** and other Dynamics products outside Dataverse

---

## Hard rules

Safety rules (init state, auth, environment confirmation) are non-negotiable. Tool selection (rules 1, 2, 4) is capability-based.

### 0. Check init state first

Before writing any code or creating any files:

1. **Search your callable tools for anything whose name or description contains `dataverse`.** Tools are often registered under environment-specific names (for example `mcp__dataverse_<orgid>__read_query`). If a Dataverse MCP tool exists, use it directly and skip setup — MCP auth is host-managed and needs no `.env` or `scripts/auth.py`. Never declare MCP unavailable based only on the initially displayed tool list.
2. **No MCP? Check for a CLI profile** — the fastest path for data operations:

   ```bash
   dataverse auth who
   ```

   An active profile with an environment URL means you can use the CLI for data operations right away (see `dataverse-query` / `dataverse-data`). For explicit "connect" or "set up" requests, run `dataverse-connect` anyway — it configures MCP, SDK, and PAC together.
3. **No CLI profile? Check workspace init:**

   ```bash
   ls .env scripts/auth.py 2>/dev/null
   ```

   - Both exist: confirm with `python scripts/auth.py --ping` and proceed.
   - Either is missing: run `dataverse-connect`. It copies `auth.py` into the project's `scripts/` folder and writes `.env`.

### 1. Python for scripting; CLIs and MCP are first-class

Python is the language for automation logic (transformation, control flow, retry, CSV handling). MCP tools, the Dataverse CLI (`dataverse`), the Python SDK, and PAC CLI (`pac`) are all first-class — use whichever fits.

**Never:**

- Write automation logic in JavaScript/TypeScript/Node.js (`npm`, `yarn`, `pnpm`, `package.json`, `node_modules/`)
- Use `@azure/msal-node`, `@azure/identity`, or any Node.js Azure SDK
- Implement a bespoke MSAL or device-code flow

**Always:**

- Use `pip install` and the Python SDK (`PowerPlatform-Dataverse-Client`) for data and schema logic
- Use `scripts/auth.py` for tokens and credentials; `azure-identity` (Python) for Azure credential flows
- Treat `dataverse` and `pac` as allowed first-party CLIs

### 2. Pick the surface that fits

There is no mandated tool order — pick by capability (see [Tool capabilities](#tool-capabilities)).

- Prefer a managed surface (MCP, Dataverse CLI, SDK) over hand-rolled OData — they handle auth, paging, retry, and geo routing. When MCP can't do the job (bulk > 25 records, large reads, forms/views/N:N/global option sets/alternate keys, multi-step workflows, analytics, or MCP isn't configured), default to the **Python SDK**.
- **Raw Web API is the last resort**, only for operations with no managed path (unbound actions such as `PublishXml`, global option sets). Even then prefer `dataverse api` (managed auth, exit codes) over `urllib` + `get_token()`.
- Forms and views are **not** raw-only: they are SDK `records.create` / `records.update` on `systemform` / `savedquery`; only `PublishXml` needs `dataverse api`. Aggregates and N:N joins are not raw-only either: use `client.query.fetchxml()`, or `dataverse data associate` for N:N writes.
- If an SDK method fails or a PAC command seems missing, check the owning skill before hand-rolling HTTP.

**Field casing:** `$select` / `$filter` use lowercase logical names (`new_name`). `$expand` and `@odata.bind` use navigation property names, which are case-sensitive and must match `$metadata` (for example `new_AccountId`). The SDK does not fix wrong casing on `@odata.bind` keys, and raw Web API calls are fully manual — `new_accountid@odata.bind` returns 400.

**Publisher prefix:** never hardcode a prefix (especially `new`). Query existing publishers and ask the user — the prefix is permanent. See `dataverse-solution`.

### 3. Use the documented auth patterns

Three entry points share one sign-in:

| Entry point | Serves |
| --- | --- |
| `dataverse auth create` (Dataverse CLI) | Writes a shared MSAL token cache used by the CLI, the MCP proxy, and `scripts/auth.py` (via `msal-extensions`) |
| `scripts/auth.py` | Python/SDK auth. Order: service principal, shared CLI cache, device code. Use `get_client()` for the SDK, `get_token()` for raw Web API headers |
| `pac auth create` (PAC CLI) | Authenticates `pac` for `dataverse-solution`, `dataverse-admin`, and `dataverse-security` |

**Never:**

- Read or parse raw token cache files (for example `tokencache_msalv3.dat`) — reuse the cache only through `scripts/auth.py` / `msal-extensions`
- Implement your own MSAL device-code flow
- Hardcode tokens or credentials in scripts
- Invent a new auth mechanism

If auth is expired or missing, re-run `dataverse auth create` or `pac auth create`, or check `.env`. See `dataverse-connect`.

### 4. Be honest about gaps

The skills document tested, non-deprecated sequences — follow them when they fit. If a call fails with `AttributeError`, the installed SDK may not have that method; check the skill's version note and use the documented alternative.

- If a gap isn't covered, say so and suggest a workaround. **Never invent a method, parameter, or endpoint.**
- **Connectivity is not auth.** A token from `login.microsoftonline.com` can succeed while the org's data-plane host is unreachable. Never report a count or result that did not come back from a real call. Verify with `python scripts/auth.py --check`; if it fails, report "unreachable" rather than a number.

---

## Tool capabilities

| Tool | Use for | Does not support |
| --- | --- | --- |
| **MCP server** | Record CRUD (batch up to 25 per call); table create/update/delete and column add (including local choice/multiselect and lookup/customer columns); schema and record inspection via `describe`; metadata search (`search`); data and file-content search (`search_data`, when Dataverse search is enabled); file upload/download | Forms, views, **global** option sets, **N:N** relationships, alternate keys, solutions. See [MCP gotchas](#mcp-gotchas) |
| **Python SDK — writes** (`dataverse-data`) | Scripted writes at volume: record CRUD, upsert on alternate keys, `CreateMultiple` / `UpdateMultiple` / `UpsertMultiple`, CSV import with lookup resolution, file column uploads (chunked > 128 MB) | Global option sets, `$ref` association, `$apply` aggregation, table/column/relationship creation (use `dataverse-metadata`), custom action invocation |
| **Python SDK — reads** (`dataverse-query`) | Multi-page iteration, OData select/filter/expand/orderby, QueryBuilder fluent API, formatted values, `$expand` for lookups, aggregates and N:N joins via `client.query.fetchxml()`, pandas DataFrame handoff, Jupyter snippets | `$apply` and N:N `$expand` on the QueryBuilder path — use `records.list(expand=...)` for N:N or `fetchxml()` for aggregates |
| **Dataverse CLI** (`dataverse`) | Scriptable data plane: `data` CRUD, `associate` / `disassociate` (N:N and `$ref`), `data upload`; `api request` / `invoke` (Web API escape hatch); `api list` / `describe` (Custom API discovery) | Metadata/schema (use the SDK via `dataverse-metadata`), solution ALM (use PAC), forms/views. Requires a .NET runtime — use the SDK where none is available |
| **PAC CLI** (`pac`) | Solution export/import/pack/unpack; environment create/list/delete/reset; auth profiles; plugin updates (`pac plugin push` — first-time registration needs the Web API); role assignment (`pac admin assign-user`); `pac solution add-solution-component` | Data CRUD, metadata creation (tables/columns/forms), listing solution components (no `list-components` — query `solutioncomponent` via SDK or CLI) |
| **Azure CLI** (`az`) | App registrations, service principals, credential management | Dataverse-specific operations |
| **GitHub CLI** (`gh`) | Repo management, GitHub secrets, Actions workflow status | Dataverse-specific operations |
| **Raw Web API** (last resort) | Only operations no managed surface exposes: unbound actions such as `PublishXml`, global option sets, similar edge cases | Nothing functionally — but raw `urllib` bypasses managed auth, paging, and retry. Prefer `dataverse api` |

If MCP tools are missing from your tool list, load `dataverse-connect`.

### MCP gotchas

- **Table creation may time out but still succeed** — always `describe('tables/{name}')` before retrying.
- **Run MCP queries sequentially** — parallel calls time out.
- **Column names with spaces normalize to underscores** — `"Specialty Area"` becomes `<prefix>_specialty_area`.
- **SQL (`read_query`)** supports `JOIN`, `GROUP BY` (COUNT/SUM/AVG/MIN/MAX), `TOP`, `WHERE`, `ORDER BY`. It does **not** support `DISTINCT`, `HAVING`, subqueries, `OFFSET`, `UNION`, `CASE`/`IF`, `CAST`/`CONVERT`, CTEs, or date functions. For those use `client.query.sql()` (also allows `DISTINCT`, < 5K rows), `$apply`, or a QueryBuilder DataFrame with pandas — see `dataverse-query`.

### Volume guidance

| Volume | Surface |
| --- | --- |
| One-off command | `dataverse data create` / `query` / `count` |
| Up to ~25 records per call, simple filters | MCP |
| Larger bulk writes | SDK `CreateMultiple`, chunked starting at ~1,000 (see `dataverse-data`) |
| Bulk reads and analytics | SDK (see `dataverse-query`) |
| `$apply` aggregation | Web API via `dataverse api` |

### SDK method cheat-sheet

SDK method names are the least discoverable surface, so they are the easiest to hallucinate. This maps common operations to the exact call — it is not a preference signal; MCP or CLI are equally valid per rule 2.

| Operation | SDK call | Skill |
| --- | --- | --- |
| Create / update / delete records | `client.records.create()` / `.update()` / `.delete()` (pass a list for bulk) | `dataverse-data` |
| Upsert on an alternate key | `client.records.upsert()` | `dataverse-data` |
| Query / filter records | `client.records.list(...)` (flat) or `.list_pages(...)` (streaming) | `dataverse-query` |
| One record by GUID | `client.records.retrieve(table, guid)` (`None` if missing) | `dataverse-query` |
| Aggregation / server-side joins | `client.query.fetchxml(xml)` | `dataverse-query` |
| Fluent query build | `client.query.builder(Table).where(...).execute()` | `dataverse-query` |
| Limited SQL read | `client.query.sql("SELECT ...")` | `dataverse-query` |
| Load into pandas | `client.query.builder(table).select(...).execute().to_dataframe()` | `dataverse-query` |
| Upload to a file column | `client.files.upload(...)` | `dataverse-data` |
| Create tables / columns / lookups / N:N | `client.tables.create()` / `.add_columns()` / `.create_lookup_field()` / `.create_many_to_many_relationship()` | `dataverse-metadata` |
| Create an alternate key | `client.tables.create_alternate_key(...)` | `dataverse-metadata` |
| Inspect existing schema | `client.tables.list_columns(table)` / `.list_table_relationships(table)` | `dataverse-metadata` |
| Create publisher / solution | `client.records.create("publisher" / "solution", {...})` | `dataverse-solution` |

### MCP availability

When a request involves MCP explicitly or implicitly, run the same tool search as rule 0.

| Situation | Action |
| --- | --- |
| MCP missing, user **explicitly** asked for MCP ("use MCP to query...") | Do **not** silently fall back to the SDK. Say "Dataverse MCP tools aren't configured in this session yet.", load `dataverse-connect`, then **stop** — the session must restart for MCP tools to appear |
| MCP missing, user asked a data question ("how many accounts?") | Answer with the CLI (if a profile exists) or the SDK, then offer: "MCP would handle this conversationally — want me to set it up?" |
| MCP available | Prefer MCP for simple reads, queries, and small CRUD. Use the SDK only when a script is needed |

---

## Safe change lifecycle

For any real change, walk these steps in order: confirm **where**, confirm the **container**, then persist the **result**.

### Step 1 — Confirm the environment (mandatory)

Dataverse work often spans dev, test, staging, and prod with different credentials. Never assume the active PAC profile, `.env`, memory, or a previous session reflects the right target.

Before the **first** operation that touches an environment (creating a table, deploying a plugin, importing a solution, inserting data):

1. Show the environment URL you intend to use.
2. Ask the user to confirm it: "I'm about to make changes to `<URL>`. Is this the correct target environment?"
3. Run `pac org who` and verify the active connection matches.

**Do not proceed until the user explicitly confirms.** This is the most important safety check — skipping it risks irreversible changes to the wrong environment. Once confirmed, you don't need to re-confirm for later operations against the same environment in the same session.

### Step 2 — Confirm the solution (before any metadata change)

Metadata created outside a solution lands only in the default solution and cannot be cleanly exported or deployed. Always solution-first:

1. Ask: "What solution should these components go into?"
2. If `.env` has `SOLUTION_NAME`, confirm it with the user.
3. If no solution exists, load `dataverse-solution` and follow its publisher discovery and creation flow. Use the SDK, never raw Web API:

   ```python
   # Quick reference; the full flow with publisher discovery is in dataverse-solution
   publisher_id = client.records.create("publisher", {
       "uniquename": "<name>", "friendlyname": "<display>",
       "customizationprefix": "<prefix>", "description": "<desc>",
   })
   solution_id = client.records.create("solution", {
       "uniquename": "<Name>", "friendlyname": "<Display>",
       "version": "1.0.0.0",
       "publisherid@odata.bind": f"/publishers({publisher_id})",
   })
   ```

4. Pass `solution="<UniqueName>"` on all SDK metadata calls, or send the `"MSCRM.SolutionName": "<UniqueName>"` header on raw Web API metadata calls.

### Step 3 — Pull to the repo (mandatory)

After any metadata change (MCP, SDK, Web API, or maker portal), end the session by pulling the solution into source control:

```bash
pac solution export --name <SOLUTION_NAME> --path ./solutions/<SOLUTION_NAME>.zip --managed false
pac solution unpack --zipfile ./solutions/<SOLUTION_NAME>.zip --folder ./solutions/<SOLUTION_NAME>
rm ./solutions/<SOLUTION_NAME>.zip
git add ./solutions/<SOLUTION_NAME>
git commit -m "feat: <description>"
git push
```

The repo is always the source of truth.

---

## Scripts

`scripts/auth.py` (copied into the project by `dataverse-connect`) acquires tokens and credentials for every script and the SDK. Any Web API work beyond a one-off query belongs in a Python script committed under `scripts/` that uses `scripts/auth.py`. Writes: `dataverse-data`. Queries and analytics: `dataverse-query`. Post-import validation: `dataverse-solution`.

---

## References

| Reference | When to load |
| --- | --- |
| [references/windows-scripting.md](references/windows-scripting.md) | Running on Windows — ASCII-only `.py` files, no multiline `python -c`, PAC PowerShell wrapper, unbuffered background output |
