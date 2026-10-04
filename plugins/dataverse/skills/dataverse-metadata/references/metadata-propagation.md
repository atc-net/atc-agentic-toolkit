# Metadata Propagation and Lock Contention

After tables, columns, or alternate keys are created, Dataverse runs internal work (index builds,
cache propagation) for 3-30 seconds. Submitting another metadata operation during that window
causes lock-contention errors ("another operation is running").

## Symptoms

- Choice (picklist) column creation fails with `0x80040216` right after table creation
- Lookup `@odata.bind` fails with "Invalid property" shortly after column creation
- MCP `update_table` fails with "EntityId not found in MetadataCache"
- Alternate key creation fails with lock contention after table creation
- Lookup creation fails with "another customization operation is running"

## Phased creation

For multi-table schemas with keys and lookups, run phases instead of interleaving per table:

1. **Phase 1:** create ALL tables (5-8 s between each).
2. Wait 15-30 s for propagation.
3. **Phase 2:** create ALL alternate keys (3 s between each).
4. Wait 15-30 s for index builds.
5. **Phase 3:** create ALL lookups (3 s between each).

Do not interleave `create table A -> create key A -> create table B -> create key B`: the index
build for key A blocks the creation of table B.

## Idempotent table creation

Check before creating so setup scripts can be re-run. An explicit check avoids masking unrelated
errors and lets you branch on created vs reused:

```python
def ensure_table(client, schema_name, columns, solution, primary_column="prefix_Name", display_name=None):
    existing = client.tables.get(schema_name)
    if existing:
        print(f"Reusing: {schema_name}")
        return existing
    info = client.tables.create(schema_name, columns, solution=solution,
                                primary_column=primary_column, display_name=display_name)
    print(f"Created: {info['table_schema_name']}")
    return info
```

Pair it with `ensure_alternate_key` from [alternate-keys.md](alternate-keys.md).

## MCP table tools

When using MCP `create_table` / `update_table`:

- MCP covers text, numeric, boolean, datetime, choice/multiselect, lookup/customer, and file/image
  columns. Global choices, N:N relationships, alternate keys, forms, and views need the SDK or Web API.
- Creation may report a timeout or a stale cache. Always `describe('tables/{name}')` before retrying
  or calling `update_table`; if the table exists, skip creation.
- Add self-referential lookups (parent on the same table) with `update_table` after creation.

## Retry on lock contention

Handle "already exists" with the check-first helpers above. This wrapper only retries transient
lock errors, with linear back-off:

```python
import time

def retry_metadata(fn, description, max_attempts=5):
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            err = str(e).lower()
            if "another" in err and "running" in err:
                wait = 10 * (attempt + 1)
                print(f"  {description}: lock contention, waiting {wait}s (attempt {attempt + 1}/{max_attempts})...")
                time.sleep(wait)
                continue
            raise
    print(f"  WARNING: {description} failed after {max_attempts} attempts")
    return None
```

Usage:

```python
retry_metadata(
    lambda: ensure_alternate_key(client, "prefix_City", "prefix_SrcCityIdKey",
                                 ["prefix_srccityid"], "Source City ID"),
    "key prefix_City",
)
```
