# Multi-Table Import with FK Dependencies

Import related tables in dependency order with upsert, so partial failures, retries, and re-runs never create duplicates.

## Sequence

1. Create tables with source-ID columns (`prefix_Src*Id`) — **dataverse-metadata**.
2. Create alternate keys on those source-ID columns — **dataverse-metadata** (alternate keys).
3. Create the lookup relationships — **dataverse-metadata**.
4. Import data level by level with `UpsertItem` keyed on the source IDs.

The alternate key lets Dataverse match records by the source system's ID instead of by GUID.

## Choosing the alternate key

| Source | How to pick | Confirm with user? |
|---|---|---|
| Database (SQL Server, SQLite, ...) | Use the source primary key | No — decide from the schema |
| Excel / CSV | Find columns where `df[col].nunique() == len(df)`; favor names like `*_ID`, `*_Code` | **Yes** — e.g. "`Employee_ID` has 500 unique values across 500 rows. Use it as the key?" |

Uniqueness in today's data does not prove a column is the intended business key, so never create a key from a CSV column without confirmation.

## Helpers

```python
import os, sys, time
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client
from PowerPlatform.Dataverse.models.upsert import UpsertItem
from PowerPlatform.Dataverse.core.errors import HttpError
from concurrent.futures import ThreadPoolExecutor, as_completed

client = get_client()

def bind(entity_set, guid):
    """Build an @odata.bind value. entity_set must be the real EntitySetName."""
    return f"/{entity_set}({guid})"

# EntitySetName is NOT always logical_name + "s". English pluralization applies:
# country -> countries, city -> cities, winby -> winbies, extraruns -> extrarunses.
# Query the real names first:
#   GET /api/data/v9.2/EntityDefinitions?$select=LogicalName,EntitySetName

def bulk_upsert(logical_name, items, chunk_size=1000, retries=3):
    """Upsert in adaptive chunks with retry. Doubles the chunk on success (up to
    max_size), halves it on payload/timeout failure and caps max_size there to
    avoid oscillation. Safe to re-run."""
    current_size = chunk_size
    max_size = 4000
    i = 0
    while i < len(items):
        chunk = items[i:i + current_size]
        for attempt in range(retries):
            try:
                client.records.upsert(logical_name, chunk)
                print(f"  {logical_name}: {i + len(chunk)}/{len(items)} (chunk={current_size})", flush=True)
                i += len(chunk)
                current_size = min(current_size * 2, max_size)
                break
            except HttpError as e:
                if e.status_code == 429 and attempt < retries - 1:
                    time.sleep(5 * (attempt + 1))
                    continue
                if e.status_code in (413, 500) and current_size > 100:
                    current_size = max(current_size // 2, 100)
                    max_size = current_size
                    print(f"  {logical_name}: chunk capped at {current_size}", flush=True)
                    break  # retry same offset with the smaller chunk
                raise
            except (TimeoutError, ConnectionError, OSError):
                # SDK POST timeout is 120 s
                if current_size > 100:
                    current_size = max(current_size // 2, 100)
                    max_size = current_size
                    print(f"  {logical_name}: timeout, chunk capped at {current_size}", flush=True)
                    break
                raise
        else:
            i += len(chunk)  # all retries exhausted: skip the chunk

def build_map(logical_name, src_col, id_col):
    """Return {source_id: guid} by querying back (upsert returns no GUIDs)."""
    result = {}
    for r in client.records.list(logical_name, select=[src_col, id_col]):
        src_val = r.get(src_col)
        if src_val is not None:
            result[src_val] = r[id_col]
    return result

def upsert_table(logical_name, items, chunk_size=1000):
    """ThreadPoolExecutor target: upsert one table."""
    bulk_upsert(logical_name, items, chunk_size)
    return logical_name
```

## Import by dependency level

Tables at the same level are independent — import them concurrently. Levels run sequentially because Level 1 needs Level 0's GUIDs.

```python
# Level 0: tables with no FK dependencies. Alternate keys must already exist.
level0 = {
    "prefix_country": [UpsertItem(
        alternate_key={"prefix_srccountryid": r["id"]},
        record={"prefix_name": r["name"]},  # key columns must NOT be in the record body
    ) for r in country_rows],
    "prefix_team": [UpsertItem(
        alternate_key={"prefix_srcteamid": r["id"]},
        record={"prefix_name": r["name"]},
    ) for r in team_rows],
}

with ThreadPoolExecutor(max_workers=len(level0)) as pool:
    futures = {pool.submit(upsert_table, t, items): t for t, items in level0.items()}
    for f in as_completed(futures):
        table = futures[f]
        try:
            f.result()
            print(f"  {table}: done", flush=True)
        except Exception as e:
            # Keep going; upsert is idempotent, so re-run the failed table later.
            print(f"  {table}: FAILED - {e}", flush=True)

country_map = build_map("prefix_country", "prefix_srccountryid", "prefix_countryid")
team_map = build_map("prefix_team", "prefix_srcteamid", "prefix_teamid")

# Level 1: tables that reference Level 0
level1 = {
    "prefix_player": [UpsertItem(
        alternate_key={"prefix_srcplayerid": r["id"]},
        record={
            "prefix_name": r["name"],
            "prefix_TeamId@odata.bind": bind("prefix_teams", team_map[r["team_id"]]),
        },
    ) for r in player_rows if r["team_id"] in team_map],  # skip and log rows with missing lookups
}
# ... same executor pattern, then build maps for the next level
```

### Composite keys

For tables with a multi-column source PK (e.g. order lines), put **all** key columns in `alternate_key` and **none** in `record`:

```python
line_items = [UpsertItem(
    alternate_key={
        "prefix_srcorderid": r["order_id"],
        "prefix_srclineno": r["line_no"],
    },
    record={
        "prefix_name": f"Order-{r['order_id']}-Line-{r['line_no']}",
        "prefix_quantity": r["qty"],
        "prefix_unitprice": r["price"],
    },
) for r in order_line_rows]
```

## Rules

- **Parallel across tables at the same level** — they share no data or index pages. One worker per table.
- **Sequential between levels.**
- **Sequential chunks within a table.** Concurrent `UpsertMultiple` / `CreateMultiple` calls to one table contend on shared data and index pages and deadlock (SQL error 1205), even for different records.
- Key on the source system's PK with `UpsertItem` — idempotent across retries and partial failures.
- **No alternate key columns in the record body.** `UpsertMultiple` fails with "An unexpected error" when a key column appears in both; single upsert tolerates it.
- Wrap each `f.result()` in try/except so one table cannot abort the executor.
- Rebuild GUID maps after each level.
- Start at `chunk_size=1000`; narrow tables often sustain 2,000–4,000 per chunk. The limits are payload size and timeout, not record count.
- `flush=True` on every print so progress shows in real time on Windows.
- Skip and log rows whose referenced source ID has no GUID.

## Post-import verification

Compare record counts against the source. Page through with a single-column select — no need to load full DataFrames for a count:

```python
def count_records(logical_name, id_col):
    return sum(len(page) for page in client.records.list_pages(logical_name, select=[id_col]))

expected = {"prefix_department": 12, "prefix_employee": 500, "prefix_timesheet": 15000}
for table, exp in expected.items():
    actual = count_records(table, table + "id")  # prefix_department -> prefix_departmentid
    status = "OK" if actual == exp else f"MISMATCH ({actual})"
    print(f"  {table}: {status} (expected {exp})", flush=True)
```

To spot-check values, pull a DataFrame with `client.query.builder(t).select(...).execute().to_dataframe()` — see **dataverse-query**.

## First-time import with create

If the tables are guaranteed empty and the load will never be re-run, `create()` is faster than upsert (no existence check). A partial failure followed by a re-run **will** create duplicates — use only for one-shot loads into fresh environments.

```python
def bulk_create(logical_name, records, chunk_size=1000):
    """Create with adaptive chunking. Faster, but NOT safe to re-run."""
    all_guids = []
    current_size = chunk_size
    max_size = 4000
    i = 0
    while i < len(records):
        chunk = records[i:i + current_size]
        try:
            guids = client.records.create(logical_name, chunk)
            all_guids.extend(guids)
            print(f"  {logical_name}: {i + len(chunk)}/{len(records)} (chunk={current_size})", flush=True)
            i += len(chunk)
            current_size = min(current_size * 2, max_size)
        except HttpError as e:
            if e.status_code in (413, 500) and current_size > 100:
                current_size = max(current_size // 2, 100)
                max_size = current_size
                print(f"  {logical_name}: chunk capped at {current_size}", flush=True)
            else:
                raise
        except (TimeoutError, ConnectionError, OSError):
            if current_size > 100:
                current_size = max(current_size // 2, 100)
                max_size = current_size
                print(f"  {logical_name}: timeout, chunk capped at {current_size}", flush=True)
            else:
                raise
    return all_guids
```
