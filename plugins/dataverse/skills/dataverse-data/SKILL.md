---
name: dataverse-data
description: >
  Record-level writes to Microsoft Dataverse tables with the Python SDK, the dataverse CLI, or MCP tools:
  create, update, delete, upsert with alternate keys, bulk CreateMultiple/UpsertMultiple,
  CSV import, multi-table foreign-key loads, DataFrame write-back, and schema-driven sample data.
  USE FOR: create Dataverse record, update record, delete record, upsert, alternate key upsert,
  bulk import, CSV import, CreateMultiple, UpsertMultiple, @odata.bind lookup, associate records,
  file column upload, seed data, generate sample data, multi-table import with FK dependencies.
  DO NOT USE FOR: reading or analyzing records (use dataverse-query),
  tables, columns, relationships, alternate key definitions, forms, views (use dataverse-metadata),
  solution export or deployment (use dataverse-solution).
---

# Dataverse Data Writes

Create, update, delete, upsert, and bulk-import records in Microsoft Dataverse.

> **Python and the `dataverse` CLI only.** Do not script Dataverse with Node.js or JavaScript. If you are about to run `npm install` for a script or write a `.js` file, stop — see the hard rules in **dataverse-overview**.

## When to use

- Writing, modifying, or deleting individual records
- Bulk loads from CSV, Excel, or another database
- Idempotent re-runnable imports keyed on source-system IDs
- Seeding tables with realistic sample data for dev, demos, or tests

| Need | Use instead |
|---|---|
| Query, filter, aggregate, export records | **dataverse-query** |
| Tables, columns, relationships, alternate keys, forms, views | **dataverse-metadata** |
| Export or deploy solutions | **dataverse-solution** |

---

## Choose the write surface

| Volume / shape | Surface | Why |
|---|---|---|
| 1 record, one-liner | CLI `dataverse data create/update/upsert/delete` | No script, no workspace setup |
| 2–25 records, interactive | MCP `create_record` / `update_record` / `delete_record` | Up to 25 records per call |
| 25+ records, transformation, retries, CSV | SDK `client.records.*` | CreateMultiple/UpsertMultiple, paging, retry |
| Upsert by alternate key | CLI `data upsert` or SDK `UpsertItem` | MCP has no upsert tool |
| Associate / disassociate, file upload | CLI `data associate` / `data upload` | One-liner |

**CLI fast path:** if `dataverse auth who` shows an active profile, CLI writes work immediately — no `.env`, `auth.py`, or pip. SDK and bulk work still need the workspace set up by **dataverse-connect**.

**Scripted writes use the SDK, not hand-rolled HTTP.** The SDK carries auth, paging, and retry. Import `get_client` — not `get_token` plus `requests`. `get_token()` exists only for genuine gaps (global option sets, unbound actions), and even there prefer the managed `dataverse api` escape hatch.

### SDK coverage

| Supported | Not supported (use the alternative) |
|---|---|
| create, update, delete | Global option sets — see **dataverse-metadata** |
| Upsert with alternate keys | N:N association — CLI `dataverse data associate` or `POST .../<entity>(<id>)/<nav>/$ref` |
| CreateMultiple, UpdateMultiple, UpsertMultiple | `$apply` aggregation — use `client.query.fetchxml()` (**dataverse-query**) |
| File column uploads (chunked above 128 MB) | Unbound actions (`PublishXml`, `InstallSampleData`) — `dataverse api request` / `invoke` |
| Lookup reads inside a write workflow | DeleteMultiple, general OData `$batch` |
| Context manager with connection pooling | |

Forms and views (`systemform` / `savedquery`) are ordinary records — write them with `client.records.*` (see **dataverse-metadata**).

PyPI package: `PowerPlatform-Dataverse-Client` (GA 1.0.0). It is the only official package — never install `dataverse-api` or other look-alikes.

---

## CLI write commands

```bash
# Create (--table is the EntitySet name)
dataverse data create --table accounts --data '{"name":"Contoso"}' --return --json

# Update by GUID
dataverse data update --table accounts --id <guid> --data '{"name":"Contoso (updated)"}' --json

# Upsert by alternate key (idempotent)
dataverse data upsert --table accounts --key "accountnumber='ACC-001'" --data '{"name":"Contoso Ltd"}' --json

# Delete (--no-confirm skips the prompt)
dataverse data delete --table accounts --id <guid> --no-confirm

# Associate (N:N or lookup)
dataverse data associate --table accounts --id <guid> --relationship contact_customer_accounts --related contacts --related-id <contact-guid>

# Disassociate (N:N: pass --related-id; clearing a lookup: omit it)
dataverse data disassociate --table accounts --id <guid> --relationship contact_customer_accounts --related-id <contact-guid>

# Upload to a file column (--table is the LogicalName here, not the EntitySet)
dataverse data upload --table account --id <guid> --column new_document --file report.pdf

# Describe schema (attributes, relationships, actions)
dataverse data describe --table account --include all --json

# Invoke a custom API (find names with 'dataverse api list')
dataverse api invoke <CustomApiName> --target dataverse --param Input=value

# Raw escape hatch for built-in actions (--target is required)
dataverse api request --target dataverse --path "/api/data/v9.2/WhoAmI"
```

---

## SDK setup

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

`get_client()` loads `.env`, resolves the environment URL, and handles auth (see `scripts/auth.py`, installed by **dataverse-connect**). For scripts that run to completion, wrap the client in a `with` block for connection cleanup; in notebooks the bare client is fine.

## Field name casing

Wrong casing is the most common cause of HTTP 400.

| Property type | Convention | Example | Used in |
|---|---|---|---|
| Structural (columns) | LogicalName, always lowercase | `new_name` | Payload keys |
| Navigation (lookups) | Navigation property name, case-sensitive per `$metadata` | `new_AccountId` | `@odata.bind` keys |

The SDK lowercases structural keys but preserves `@odata.bind` key casing.

---

## Single-record operations

```python
# Create
guid = client.records.create("new_ticket", {
    "new_name": "Ticket 001",
    "new_priority": 100000002,                          # choice: integer value, never the label
    "new_AccountId@odata.bind": "/accounts(<account-guid>)",
})

# Update
client.records.update("new_ticket", guid, {"new_status": 100000001})

# Delete
client.records.delete("new_ticket", guid)
```

### `@odata.bind` rules

- Key is the navigation property name plus `@odata.bind`; value is `"/<EntitySetName>(<guid>)"`.
- EntitySetName is not always logical name + `s` (`country` → `countries`). Look it up in `EntityDefinitions?$select=LogicalName,EntitySetName`.
- Just created the lookup column? Wait 5–10 seconds before inserting — metadata propagation causes "Invalid property" errors.

| Lookup | Correct key | Wrong |
|---|---|---|
| Custom `new_AccountId` | `new_AccountId@odata.bind` | `new_accountid@odata.bind` |
| Polymorphic `customerid` | `customerid_account@odata.bind` | `customerid@odata.bind` |
| `parentcustomerid` | `parentcustomerid_account@odata.bind` | `_parentcustomerid_value@odata.bind` |

Find the navigation property name: after creating a lookup with the SDK, read `result.lookup_schema_name`. For existing tables:

```text
GET /api/data/v9.2/EntityDefinitions(LogicalName='<entity>')/ManyToOneRelationships?$select=ReferencingEntityNavigationPropertyName,ReferencedEntity
```

---

## Bulk operations

```python
# Bulk create (CreateMultiple)
records = [{"new_name": f"Ticket {i}", "new_priority": 100000000} for i in range(500)]
guids = client.records.create("new_ticket", records)

# Broadcast one change to many records (UpdateMultiple)
client.records.update("new_ticket", [id1, id2, id3], {"new_status": 100000001})
```

**The SDK does not chunk.** It sends the whole list in one POST. There is no fixed record-count limit; the limits are payload size and the 120 s POST timeout. Chunk in your script: start at 1,000, double on success up to 4,000, halve on 413/500/timeout and cap at the last good size. Narrow tables tolerate larger chunks. The adaptive `bulk_upsert` / `bulk_create` helpers are in [references/multi-table-fk-import.md](references/multi-table-fk-import.md).

### DataFrame write-back

```python
client.dataframe.update("opportunity", df_updates, id_column="opportunityid")  # df must include the PK
guids = client.dataframe.create("opportunity", df_new_records)                # returns a Series of GUIDs
```

DataFrame write-back supports create and update only — no upsert. Reads into DataFrames are in **dataverse-query**.

---

## Upsert with alternate keys

Idempotent — re-running never creates duplicates. The alternate key must already exist on the table (**dataverse-metadata**).

```python
from PowerPlatform.Dataverse.models.upsert import UpsertItem

client.records.upsert("account", [
    UpsertItem(alternate_key={"accountnumber": "ACC-001"},
               record={"name": "Contoso Ltd", "description": "Primary account"}),
    UpsertItem(alternate_key={"accountnumber": "ACC-002"},
               record={"name": "Fabrikam Inc"}),
])
```

**Never repeat alternate key columns in `record`.** Single upsert tolerates it; `UpsertMultiple` fails with "An unexpected error occurred".

---

## CSV import

Use `create()` only for one-shot loads. Anything that might be re-run should use `UpsertItem` (see above and the multi-table reference).

```python
import csv, os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

with open("data/customers.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

records = [{"new_name": r["name"], "new_email": r["email"]} for r in rows]

chunk_size = 1000  # one POST per chunk; raise for narrow tables
for i in range(0, len(records), chunk_size):
    guids = client.records.create("new_customer", records[i:i + chunk_size])
    print(f"Imported {i + len(guids)}/{len(records)}", flush=True)
```

### Resolve lookups before import

When the source has a business key (e.g. email) and Dataverse needs a GUID, build a map first:

```python
email_to_guid = {
    r["new_email"]: r["new_customerid"]
    for r in client.records.list("new_customer", select=["new_customerid", "new_email"])
}

records = []
for row in rows:
    customer_guid = email_to_guid.get(row["customer_email"])
    if not customer_guid:
        print(f"Skipping row, unknown email: {row['customer_email']}", flush=True)
        continue
    records.append({
        "new_channel": row["channel"],
        "new_CustomerId@odata.bind": f"/new_customers({customer_guid})",  # verify EntitySetName
    })

guids = client.records.create("new_interaction", records)
```

### Discover required fields on system tables

Before bulk-creating into `account`, `contact`, `opportunity`, etc.:

1. Create one test record with your minimal payload.
2. On `HttpError` 400 the message names the missing required field. Some requirements are plugin-enforced and not visible in `describe`.
3. Delete the test record, then run the bulk load.

---

## Multi-table import with FK dependencies

Load in dependency order with `UpsertItem` and alternate keys on source IDs:

1. Create tables with source-ID columns, alternate keys, and lookups (**dataverse-metadata**).
2. Import Level 0 tables (no FKs) in parallel with `ThreadPoolExecutor`, one worker per table.
3. Query back to build source-ID → GUID maps (upsert does not return GUIDs).
4. Repeat per level — Level N binds to Level N-1 maps via `@odata.bind`.

Invariants:

- Parallel across tables at the same level; sequential between levels; **sequential chunks within a table** (concurrent writes to one table deadlock, SQL error 1205).
- Alternate key columns never appear in the record body.
- Catch failures per table inside the executor so one table cannot kill the others.
- Start `chunk_size=1000` and let the helper adapt.

Full helpers, composite keys, verification, and the create-only variant: [references/multi-table-fk-import.md](references/multi-table-fk-import.md).

---

## Sample data generation

Generate records inline from the table schema — table-agnostic and PII-safe (`@example.com` emails, `555-01xx` phones).

Flow: confirm environment, table, and count (default 5) → read required columns with `client.tables.list_columns(TABLE, filter="AttributeOf eq null")` → pick a generator per `AttributeType` → `client.records.create()` (list form for 10+ records).

- Skip Lookup, Uniqueidentifier, State, Status, Owner, and Customer columns unless the user supplies values.
- `DisplayName.UserLocalizedLabel` can be null — dereference safely.

Confirm before running, with a concrete plan instead of an open question:

- Avoid: "Which environment should I target? Please provide the Dataverse URL."
- Prefer: "I'll generate 20 `contact` records with CreateMultiple, `@example.com` emails and `555-01xx` phones, against the active `pac auth list` environment. Confirm, or name a different environment."

For a custom table with unknown schema, say you will query `EntityDefinitions` for required columns first, then confirm the count.

Template and safety rules: [references/sample-data-generation.md](references/sample-data-generation.md).

---

## Error handling

```python
from PowerPlatform.Dataverse.core.errors import HttpError

try:
    guid = client.records.create("new_ticket", {"new_name": "Test"})
except HttpError as e:
    print(f"Status {e.status_code}: {e.message}")
    if e.details:
        print(f"Details: {e.details}")
```

| Status | Likely cause |
|---|---|
| 400 | Wrong field name or casing, bad `@odata.bind`, missing required field, alternate key column in upsert body |
| 403 | Missing security role privileges |
| 404 | Table or record not found |
| 413 / 500 on bulk | Chunk too large — halve it |
| 429 | Throttled; the SDK retries — reduce chunk size if it persists |

## Safety rules

- Confirm the target environment before any write, bulk load, or delete.
- Prefer upsert over create for anything that may be re-run.
- Never parallelize chunks within a single table.
- Log and skip rows whose lookup cannot be resolved; do not guess GUIDs.
- Always query the live environment to verify results — not local copies of the source data.

## Windows scripting

- ASCII only in `.py` files — curly quotes and em dashes cause `SyntaxError` on Windows.
- Do not use `python -c` for multi-line code; write a `.py` file.
- Generate GUIDs in Python (`str(uuid.uuid4())`), not via shell substitution.
- Use `flush=True` on progress prints.

## References

| Reference | When to load |
|---|---|
| [references/multi-table-fk-import.md](references/multi-table-fk-import.md) | Importing several related tables, adaptive chunking helpers, composite keys, post-import count verification |
| [references/sample-data-generation.md](references/sample-data-generation.md) | Generating sample/seed records for any table |
