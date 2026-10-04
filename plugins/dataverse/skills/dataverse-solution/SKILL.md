---
name: dataverse-solution
description: >
  Dataverse solution lifecycle with PAC CLI and the Python SDK: publisher and solution
  creation, adding components, export/unpack, pack/import, and post-import validation.
  USE FOR: create a solution, publisher prefix, add solution component, export solution,
  unpack solution, pack solution, import solution, deploy to test or prod, promote
  customizations between environments, managed vs unmanaged, import job status,
  post-import validation, msdyn_solutionhistory errors.
  DO NOT USE FOR: tables, columns, relationships, forms, views (use dataverse-metadata),
  record writes (use dataverse-data), queries (use dataverse-query), connecting or MCP
  setup (use dataverse-connect), role assignment (use dataverse-security).
---

# Dataverse Solution Lifecycle

Create, export, unpack, pack, import, and validate Dataverse solutions. PAC CLI owns the file and transport operations; the Python SDK creates publisher and solution records and validates the result.

## When to use

- Packaging customizations into a solution, or creating the first solution and publisher
- Pulling an environment's customizations into the repo (export + unpack)
- Pushing source to another environment (pack + import), dev to test to prod
- Checking that an import actually landed

| Need | Use instead |
| --- | --- |
| Create tables, columns, relationships, forms, views | `dataverse-metadata` |
| Create, update, or delete records | `dataverse-data` |
| Query or read records | `dataverse-query` |
| Connect to Dataverse or set up MCP | `dataverse-connect` |
| Assign security roles | `dataverse-security` |

## Prerequisites

- PAC CLI authenticated (`pac auth create`) against the target environment
- `scripts/auth.py` and `.env` in the project for SDK steps (set up by `dataverse-connect`)
- Environment confirmed with the user (see `dataverse-overview`, safe change lifecycle)

SDK snippets below assume this client setup:

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

---

## Create a solution

Publishers and solutions are ordinary Dataverse tables. Create them with `client.records.create()` / `client.records.list()` — not raw HTTP. The SDK handles auth, paging, and errors and avoids the URL-encoding, header, and GUID-parsing bugs that hand-rolled `urllib` introduces.

> There is no `pac solution create`. PAC handles export/import/pack/unpack, not solution record creation.

### Step 1 — Find or create the publisher

Every solution belongs to a publisher. Its `customizationprefix` (for example `contoso`, `sa`, `lit`) is prepended to every custom table, column, and relationship schema name and is **effectively permanent** — existing components keep it even if the publisher changes.

**Never use the default `new` prefix.** It carries no identity, risks collisions, and signals skipped best practice.

Always run discovery before creating a publisher:

```python
publishers = client.records.list(
    "publisher",
    filter="customizationprefix ne 'none' and uniquename ne 'MicrosoftCorporation' and uniquename ne 'Microsoftdynamic'",
    select=["publisherid", "uniquename", "friendlyname", "customizationprefix"],
    top=10,
)

if publishers:
    print("Existing publishers in this environment:")
    for p in publishers:
        print(f"  {p['uniquename']} (prefix: {p['customizationprefix']}_)")
    # ASK THE USER which publisher to use, e.g. "Reuse '<name>' (prefix: <prefix>_)?"
    publisher_id = publishers[0]["publisherid"]  # only after the user confirms
else:
    # ASK THE USER for a prefix (2-8 lowercase chars, e.g. 'contoso')
    publisher_id = client.records.create("publisher", {
        "uniquename": "<publisheruniquename>",
        "friendlyname": "<Publisher Display Name>",
        "customizationprefix": "<prefix>",  # from the user, never 'new'
        "description": "<description>",
    })
```

- **Always ask the user** before creating a publisher or choosing a prefix.
- The prefix must match tables already in the solution — prefixes cannot be mixed.
- One publisher can own many solutions; reuse an existing one when possible.

### Step 2 — Create the solution record

```python
solution_id = client.records.create("solution", {
    "uniquename": "<UniqueName>",
    "friendlyname": "<Display Name>",
    "version": "1.0.0.0",
    "publisherid@odata.bind": "/publishers(<publisher_guid>)",
})
print(f"Created solution: {solution_id}")
```

| Field | Value |
| --- | --- |
| `uniquename` | `<UniqueName>` (no spaces) |
| `friendlyname` | `<Display Name>` |
| `version` | `1.0.0.0` |
| `publisherid` | Publisher GUID from step 1, bound via `publisherid@odata.bind` |

### Step 3 — Add components

```bash
pac solution add-solution-component \
  --solutionUniqueName <UniqueName> \
  --component <ComponentSchemaName> \
  --componentType <TypeCode> \
  --environment <url>
```

PAC uses camelCase arguments here (`--solutionUniqueName`, `--componentType`), not kebab-case. Repeat per component.

| Type code | Component |
| --- | --- |
| 1 | Entity (table) |
| 2 | Attribute (column) |
| 26 | View |
| 60 | Form |
| 61 | Web resource |
| 300 | Canvas app |
| 371 | Connector |

### Alternative — auto-add with the `MSCRM.SolutionName` header

Metadata created through the Web API is added to a solution automatically when the request carries the `MSCRM.SolutionName` header (SDK metadata calls take `solution="<UniqueName>"` instead):

```python
from auth import get_token

token = get_token()
headers = {
    "Authorization": f"Bearer {token}",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "MSCRM.SolutionName": "<UniqueName>",
}
```

**Always verify afterwards.** A misspelled header or missing solution silently puts components in the default solution. `pac solution list-components` does not exist — query `solutioncomponent`:

```python
sol = client.records.list(
    "solution",
    filter="uniquename eq '<UniqueName>'", select=["solutionid"], top=1,
).first()
if sol is not None:
    components = client.records.list(
        "solutioncomponent",
        filter=f"_solutionid_value eq {sol['solutionid']}",
        select=["componenttype", "objectid"],
    )
    print(f"{len(components)} components in the solution")
```

---

## Find the solution name

```bash
pac solution list --environment <url>
```

Pass the `UniqueName` column to other commands. Display names contain spaces; unique names do not.

## Pull — export and unpack

> **Confirm the environment first.** Run `pac auth list` and `pac org who`, show the output, and have the user confirm it is the intended environment. Never assume.

Export as unmanaged (the source of truth):

```bash
pac solution export \
  --name <UniqueName> \
  --path ./solutions/<UniqueName>.zip \
  --managed false \
  --environment <url>
```

Unpack into editable source:

```bash
pac solution unpack \
  --zipfile ./solutions/<UniqueName>.zip \
  --folder ./solutions/<UniqueName> \
  --packagetype Unmanaged
```

> **Windows file-lock race:** run export and unpack as separate commands. Chaining them immediately can hit a transient ZIP lock. If unpack fails with a lock or "in use" error, retry after a moment and check the unpacked folder has the expected components before deleting the zip.

Delete the zip — the unpacked folder is the source — and commit:

```bash
rm ./solutions/<UniqueName>.zip
git add ./solutions/<UniqueName>
git commit -m "chore: pull <UniqueName> baseline"
git push
```

## Push — pack and import

```bash
pac solution pack \
  --zipfile ./solutions/<UniqueName>.zip \
  --folder ./solutions/<UniqueName> \
  --packagetype Unmanaged
```

Import (async recommended for large solutions):

```bash
pac solution import \
  --path ./solutions/<UniqueName>.zip \
  --environment <url> \
  --async \
  --activate-plugins
```

Poll the job with `pac solution list --environment <url>`.

### Import notes

- Use `--managed false` / `--packagetype Unmanaged` for the development solution. Managed packages are for downstream environments (test, prod).
- `--activate-plugins` activates registered plugins contained in the solution.
- "Solution already exists" errors: re-run with `--import-mode ForceUpgrade`.
- Large solutions (Sales, Customer Service) can take 10-20 minutes. Poll — do not re-import.

---

## Post-import validation

Verify components are live with the SDK. No extra scripts are needed.

### Table exists

```python
info = client.tables.get("<logical_name>")
if info:
    print(f"[PASS] Table '{info.logical_name}' exists")
else:
    print("[FAIL] Table '<logical_name>' not found")
```

### Form is published

```python
forms = client.records.list(
    "systemform",
    filter="objecttypecode eq '<entity>' and type eq <form_type_code>",
    select=["name", "formid"],
    top=5,
)
# Form type codes: 2 = main, 7 = quick create
```

### View exists

```python
views = client.records.list(
    "savedquery",
    filter="returnedtypecode eq '<entity>'",
    select=["name", "savedqueryid", "statuscode"],
    top=10,
)
```

### User's role assignment (N:N `$expand`)

`records.list` passes `$expand` straight through, so read the N:N navigation property directly:

```python
users = list(client.records.list(
    "systemuser",
    filter="internalemailaddress eq '<email>'",  # fallback: domainname eq '<upn>'
    select=["fullname"],
    expand=["systemuserroles_association($select=name)"],
    top=1,
))
roles = [r["name"] for r in users[0].get("systemuserroles_association", [])] if users else []
```

Or use the managed Dataverse CLI escape hatch (not `urllib`), or FetchXML with a link-entity:

```bash
dataverse api request --target dataverse --method GET \
  --path "/api/data/v9.2/systemusers?%24filter=internalemailaddress eq '<email>'&%24select=fullname&%24expand=systemuserroles_association(%24select=name)&%24top=1" \
  --environment <DATAVERSE_URL>
```

`value[0].systemuserroles_association` lists the assigned roles, each with `name`.

### Import errors

```python
jobs = client.records.list(
    "importjob",
    select=["importjobid", "solutionname", "startedon", "completedon", "progress"],
    orderby=["startedon desc"],
    top=5,
)

history = client.records.list(
    "msdyn_solutionhistory",
    filter="msdyn_status eq 1",  # 1 = failed
    select=["msdyn_name", "msdyn_starttime", "msdyn_exceptionmessage"],
    orderby=["msdyn_starttime desc"],
    top=5,
)
```

### Validation error reference

| Error | Cause | Fix |
| --- | --- | --- |
| Table not found after import | Component not in the solution | Add it with `pac solution add-solution-component` |
| Form check fails immediately | Publishing is async | Wait 30 seconds and retry |
| Role not assigned | User not provisioned | Assign with `pac admin assign-user` (see `dataverse-security`) or the Power Platform admin center |
| Import job stuck at 0% | Import still running | Poll again in 60 seconds |

## Safety rules

- Confirm the target environment with the user before every first export or import in a session.
- Never create a publisher or pick a prefix without asking; never use `new`.
- Always verify component membership after header-based auto-add.
- Never re-import a large solution while a previous import is still running.
- All validation queries need auth via `scripts/auth.py`. See `dataverse-query` for query patterns and `dataverse-data` for writes.
