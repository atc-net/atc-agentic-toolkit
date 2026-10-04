---
name: dataverse-query
description: >
  Reading and analyzing Microsoft Dataverse records with the Python SDK, the dataverse CLI, or MCP tools:
  filtered reads, paging, lookups and $expand, SQL and FetchXML joins and aggregates,
  $apply, QueryBuilder, pandas DataFrames, and Jupyter notebook exploration.
  USE FOR: query Dataverse, read records, list records, filter, count, aggregate, group by,
  join tables, FetchXML, client.query.sql, $apply, $expand, formatted values, lookup display names,
  QueryBuilder, export to DataFrame or CSV, analyze data in pandas, Jupyter notebook, paging large tables.
  DO NOT USE FOR: creating, updating, deleting, or importing records (use dataverse-data),
  table, column, relationship, form, or view definitions (use dataverse-metadata),
  solution export or deployment (use dataverse-solution).
---

# Dataverse Queries

Read, filter, join, aggregate, and analyze Microsoft Dataverse records.

> **Python and the `dataverse` CLI only.** Do not script Dataverse with Node.js or JavaScript — see the hard rules in **dataverse-overview**.

## When to use

- Answering questions about data ("how many", "which has the most", "show me ...")
- Exporting records to CSV or a DataFrame
- Interactive analysis in notebooks
- Spot-checking data after an import

| Need | Use instead |
|---|---|
| Create, update, delete, import records | **dataverse-data** |
| Tables, columns, relationships, full schema inspection | **dataverse-metadata** |
| Export or deploy solutions | **dataverse-solution** |

**Always query the live Dataverse environment.** Do not answer from local copies, cached files, or the source database — Dataverse is the source of truth.

---

## Choose the read surface

**Fast path:** if `dataverse auth who` shows an active profile, query straight away with the CLI — no `.env`, `auth.py`, pip, or PAC needed for reads.

MCP, the CLI, and the SDK all handle auth and retry. Pick by the shape of the read:

| User asks... | Approach | Why |
|---|---|---|
| Simple filter ("show me open tickets") | MCP `read_query`, CLI `dataverse data query --filter`, or `client.records.list(filter=...)` | Small result, no aggregation |
| "How many X" | CLI `dataverse data count`, MCP `read_query`, or `client.query.sql("SELECT COUNT(*) ...")` | Server-side count, no row download |
| Single-table aggregation (sum, avg, top-N) | `client.query.sql()` GROUP BY or `$apply` | Server-side, returns only groups |
| Cross-table aggregation | `client.query.sql()` INNER/LEFT JOIN + GROUP BY, or `client.query.fetchxml()`; else builder → DataFrame + `pd.merge()` | Server-side first, pandas for shapes SQL can't express |
| "X with related Y" / resolve lookups | `client.records.list(expand=...)` or QueryBuilder | Lookup resolution |
| Export / bulk extract | `client.query.builder(t).select(...).execute().to_dataframe()` | Straight to DataFrame → CSV |
| Notebook analysis | Same builder → DataFrame | pandas native |
| Duplicates / complex filter | `client.records.list(filter=...)` or QueryBuilder | SDK handles paging |
| Filtered read under 5K rows | CLI `dataverse data query --sql`, or `client.query.sql()` | Single lightweight call |

**Let the server do the work.** Aggregate and join server-side whenever SQL or FetchXML can express it. For the rest, pull each table with a minimal `select` and merge in pandas — the merge is sub-second; network transfer is the bottleneck.

For `$apply` and N:N `$expand`, prefer `client.query.fetchxml()` or the `dataverse api request` escape hatch. Hand-rolled `urllib` with `get_token()` is only justified inside a tight in-process loop — see [references/web-api-advanced.md](references/web-api-advanced.md).

---

## CLI reads

```bash
# OData read (--table is the EntitySet name: accounts, not account)
dataverse data query --table accounts --select "name,accountid" --filter "name eq 'john'" --top 10 --json

# Count
dataverse data count --table accounts

# SQL mode (logical name: account, not accounts)
dataverse data query --sql "SELECT name, accountid FROM account WHERE name LIKE '%john%'" --json

# Single record
dataverse data get --table accounts --id <guid> --json

# Raw escape hatch
dataverse api request --target dataverse --path "/api/data/v9.2/accounts?%24select=name&%24top=5"
```

### CLI gotchas

- **SQL mode mis-pluralizes custom tables.** `FROM im_category` resolves to entity set `im_categorys` and returns a **404 that looks like "table missing"**. It is not. Switch to OData mode with the real entity set: `dataverse data query --table im_categories --select im_name`. Look up `EntitySetName` in `EntityDefinitions` when unsure; never conclude a table is missing from this 404.
- **Windows quoting.** Wrap the whole `--path` in double quotes so `cmd.exe` / PowerShell do not treat `&` as a command separator. Keep `&` literal — it separates OData options, and `%26` merges them. Encode only `$` as `%24` (PowerShell reads a bare `$select` as a variable). An unquoted `&` can make the command exit non-zero even when the API returned valid JSON.

---

## SDK setup

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

`get_client()` loads `.env`, resolves the environment URL, and handles auth (`scripts/auth.py`, installed by **dataverse-connect**). Wrap it in `with` for scripts that run to completion.

## Field name casing

Wrong casing is the most common cause of HTTP 400.

| Property type | Convention | Example | Used in |
|---|---|---|---|
| Structural (columns) | LogicalName, always lowercase | `new_name` | `$select`, `$filter`, `$orderby` |
| Navigation (lookups) | Navigation property name, case-sensitive per `$metadata` | `new_AccountId` | `$expand` |

System navigation properties (`parentaccountid`, `ownerid`) are lowercase; custom ones match the SchemaName.

---

## Read records

`client.records.list()` collects all pages into a flat `QueryResult` (supports iteration, `len()`, indexing, `.first()`, `.to_dataframe()`). **Always pass `select=`.**

```python
result = client.records.list(
    "new_ticket",
    select=["new_name", "new_priority", "new_status"],
    filter="new_status eq 100000000",
    orderby=["new_name asc"],
    top=50,
)
for r in result:
    print(r["new_name"], r["new_priority"])
print(f"{len(result)} tickets")
```

Stream large tables one page at a time:

```python
for page in client.records.list_pages("new_ticket", select=["new_name"], page_size=200):
    for r in page:
        print(r["new_name"])
```

Records support dict-style access: `r["col"]`, `r.get("col")`, `r.keys()`. Do not use `r.data.get()`.

Single record by GUID — returns `None` on 404 instead of raising:

```python
record = client.records.retrieve("new_ticket", "<guid>", select=["new_name", "new_status"])
if record is None:
    print("Ticket not found")
```

> **Deprecated:** `records.get()`. Replace page loops with `records.list()` (flat) or `records.list_pages()`, and by-GUID reads with `records.retrieve()`.

### Lookup display names (formatted values)

```python
for r in client.records.list(
    "opportunity",
    select=["name", "estimatedvalue", "_parentaccountid_value"],
    include_annotations="OData.Community.Display.V1.FormattedValue",
):
    account = r.get("_parentaccountid_value@OData.Community.Display.V1.FormattedValue")
    print(f"{r['name']} - {account}")
```

`include_annotations` is mandatory — without it the `Prefer: odata.include-annotations` header is not sent and no formatted values come back. Use `"*"` for all annotations. Formatted values exist for lookup, choice, status, and owner columns.

### `$expand` related records

```python
for r in client.records.list(
    "new_ticket",
    select=["new_name", "new_status"],
    expand=["new_CustomerId($select=new_name)", "new_AgentId($select=new_name)"],
):
    customer = r.get("new_CustomerId") or {}
    agent = r.get("new_AgentId") or {}
    print(f"{r['new_name']} | {customer.get('new_name', '')} | {agent.get('new_name', '')}")
```

- `expand` takes the case-sensitive navigation property name (`new_CustomerId`); lowercase returns 400.
- Always nest `$select` inside `$expand`, otherwise every column of the related table is returned.

---

## SQL — `client.query.sql()`

Uses the Web API `?sql=` parameter, a T-SQL subset. One HTTP call — typically 2–6 s, faster than paging for small result sets.

| Supported | Not supported |
|---|---|
| `SELECT`, `SELECT DISTINCT`, `SELECT TOP N` (0–5000) | `SELECT *` |
| `INNER JOIN`, `LEFT JOIN` | `RIGHT` / `FULL` / `CROSS JOIN` |
| `WHERE`, `GROUP BY`, `ORDER BY`, `OFFSET`/`FETCH` | `HAVING`, `UNION`, subqueries, CTEs |
| `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` | `CASE`, string/date/math functions |

Results are capped at ~5,000 rows and **truncated silently** — do not use it for larger result sets.

```python
results = client.query.sql(
    "SELECT TOP 100 name, estimatedvalue "
    "FROM opportunity WHERE statecode = 0 "
    "ORDER BY estimatedvalue DESC"
)
for r in results:
    print(f"{r['name']}: {r.get('estimatedvalue', 0):,.0f}")
```

Discover which columns the SQL endpoint can query (virtual and computed lookup-display columns are excluded):

```python
for c in client.query.sql_columns("account"):
    print(f"{c['name']:30s} {c['type']:20s} PK={c['is_pk']}")  # also is_name, label
```

For full column metadata and relationships use **dataverse-metadata** (`client.tables.list_columns()`, `list_relationships()`, `list_table_relationships()`).

## FetchXML — `client.query.fetchxml()`

For joins and aggregates beyond the SQL subset or result sizes above 5K. The call returns an inert query; nothing is sent until `.execute()` (all pages) or `.execute_pages()` (lazy).

```python
query = client.query.fetchxml("""
  <fetch top="50">
    <entity name="account">
      <attribute name="name" />
      <link-entity name="contact" from="parentcustomerid" to="accountid" alias="c" link-type="inner">
        <attribute name="fullname" />
      </link-entity>
    </entity>
  </fetch>
""")

df = query.execute().to_dataframe()

for page in query.execute_pages():   # stream large results
    print(page.to_dataframe().shape)
```

## Raw Web API: `$apply` and N:N `$expand`

These are the only shapes that need the raw OData path:

- **N:N `$expand`:** `GET /<entitySet>?$expand=<nn_nav>($select=...)` — single page; follow `@odata.nextLink` past 5,000 rows.
- **`$apply`:** server-side grouping within one entity set, 50K source-record limit. Patterns: `groupby((col),aggregate(metric with sum as total))`, `aggregate($count as count)`, `aggregate(amount with average as avg)`.
- **Cross-table:** `$apply` cannot join — use `sql()` / `fetchxml()`, or builder DataFrames + `pd.merge()`.

Code samples: [references/web-api-advanced.md](references/web-api-advanced.md).

## QueryBuilder and DataFrames

`client.query.builder(table)` is a fluent API with composable AND/OR filters; `.execute().to_dataframe()` is the default for any analysis, comparison, or export:

```python
from PowerPlatform.Dataverse.models.filters import eq

df = client.query.builder("opportunity") \
    .select("name", "estimatedvalue", "statuscode") \
    .where(eq("statuscode", 1)) \
    .execute() \
    .to_dataframe()
```

Full reference, filter composition, and the DataFrame task table: [references/querybuilder.md](references/querybuilder.md). Notebook setup: [references/jupyter-setup.md](references/jupyter-setup.md).

---

## Common errors

| Status | Cause | Fix |
|---|---|---|
| 400 | Wrong casing: `$select`/`$filter` need lowercase LogicalName; `$expand` needs the case-sensitive navigation property | Check names in `EntityDefinitions(LogicalName='...')/Attributes` |
| 400 | Unsupported SQL. MCP `read_query` rejects DISTINCT, HAVING, subqueries, OFFSET, UNION, CAST/CONVERT, CASE, date functions (allows JOIN + GROUP BY). `client.query.sql()` rejects `SELECT *`, subqueries, CTEs, HAVING, UNION, RIGHT/FULL/CROSS JOIN, functions (allows INNER/LEFT JOIN, GROUP BY, DISTINCT) | Use `fetchxml()` / `$apply`, or pandas for cross-table |
| 404 | Table logical name wrong — or CLI SQL mode mis-pluralized a custom table | Verify with `client.tables.get("<name>")`; use OData mode with the real entity set |
| 429 | Throttled | SDK retries; reduce page size or pause between pages |

For `HttpError` handling in scripts see **dataverse-data**.

## Windows scripting

- ASCII only in `.py` files — curly quotes and em dashes cause `SyntaxError` on Windows.
- Do not use `python -c` for multi-line code; write a `.py` file.
- Generate GUIDs in Python (`str(uuid.uuid4())`), not via shell substitution.

## References

| Reference | When to load |
|---|---|
| [references/querybuilder.md](references/querybuilder.md) | Fluent queries, AND/OR filters, paged builder execution, choosing DataFrame vs page streaming, DataFrame write-back |
| [references/web-api-advanced.md](references/web-api-advanced.md) | `$apply` aggregation, N:N `$expand`, raw POST create responses, cross-table pandas merges |
| [references/jupyter-setup.md](references/jupyter-setup.md) | Querying from a Jupyter notebook |
