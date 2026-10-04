# QueryBuilder and DataFrames

`client.query.builder(table)` is a fluent layer over the same flat-read path as `client.records.list()`. It is available on the GA SDK (`>=1.0.0`). Use only the methods documented here — do not assume others exist.

## Basic query

```python
from PowerPlatform.Dataverse.models.filters import eq

for record in client.query.builder("opportunity") \
        .select("name", "estimatedvalue", "statuscode") \
        .where(eq("statuscode", 1)) \
        .order_by("estimatedvalue", descending=True) \
        .top(100) \
        .execute():
    print(record["name"], record["estimatedvalue"])
```

## DataFrame result

```python
df = client.query.builder("opportunity") \
    .select("name", "estimatedvalue", "statuscode") \
    .where(eq("statuscode", 1)) \
    .execute() \
    .to_dataframe()
```

## Composable filters

Combine with `|` (OR) and `&` (AND):

```python
from PowerPlatform.Dataverse.models.filters import eq, gt

active_or_pending = (eq("statecode", 0) | eq("statecode", 1)) & gt("estimatedvalue", 10000)

df = client.query.builder("opportunity") \
    .select("name", "estimatedvalue") \
    .where(active_or_pending) \
    .execute() \
    .to_dataframe()
```

## Paged execution

```python
for page in client.query.builder("opportunity").select("name").execute_pages():
    for record in page:
        print(record["name"])
```

---

## DataFrame or page streaming?

Default to `client.query.builder(t).select(...).execute().to_dataframe()` for analysis, verification, comparison, and export. Use `client.records.list_pages()` only for per-page processing or tables too large for memory.

| Task | Use | Why |
|---|---|---|
| Aggregate, group, pivot | builder → `.to_dataframe()` | pandas does it natively |
| Compare counts after import | `list_pages()` with a single-column select | No need to load a full DataFrame to count |
| Lookup map, small table | builder → `.to_dataframe()` | `dict(zip(df["src_id"], df["guid"]))` |
| Lookup map, 100K+ rows | `list_pages()` | Lower memory |
| Export to CSV / Excel | builder → `.to_dataframe()` | `df.to_csv("out.csv")` |
| Stream a large result to a file | `list_pages()` | One page in memory at a time |
| Cross-table join / aggregation | `client.query.sql()` / `fetchxml()` server-side; else per-table DataFrames + `pd.merge()` | `sql()` does INNER/LEFT JOIN; pandas for the rest |

**Always select only the columns you need** — on builder, `records.list()`, and `records.list_pages()` alike. Without a select, a 100K-row, 20-column table transfers 10–20x more data and a 15 s query becomes a 90 s query.

```python
import pandas as pd

df = client.query.builder("opportunity") \
    .select("name", "estimatedvalue", "statuscode", "_parentaccountid_value") \
    .execute() \
    .to_dataframe()
print(df.groupby("statuscode")["estimatedvalue"].agg(["count", "sum", "mean"]))
```

### Manual page iteration (fallback)

Only when you need per-page processing:

```python
all_records = []
for page in client.records.list_pages("opportunity",
                                      select=["name", "estimatedvalue", "statuscode"]):
    all_records.extend(dict(r) for r in page)  # Record -> dict
df = pd.DataFrame(all_records)
```

## DataFrame write-back

These are writes — see **dataverse-data** for the full write workflow. Only create and update are supported, not upsert; for idempotent imports use `client.records.upsert()` with `UpsertItem`.

```python
client.dataframe.update("opportunity", df_updates, id_column="opportunityid")  # df must include the PK
guids = client.dataframe.create("opportunity", df_new_records)                # Series of new GUIDs
```
